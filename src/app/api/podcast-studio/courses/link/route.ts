import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!
const PODCAST_DB_NAME = process.env.PODCAST_STUDIO_DB || 'gpp-next'

interface CoursePodcastLink {
  episodeId: string
  courseId: string
  linkType: 'direct' | 'supplementary' | 'prerequisite'
  description?: string
  createdBy: string
  createdAt: Date
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { episodeId, courseId, linkType = 'supplementary', description, userId = 'admin' } = body

    if (!episodeId || !courseId) {
      return NextResponse.json(
        { error: 'Episode ID and Course ID are required' },
        { status: 400 }
      )
    }

    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    const db = client.db(PODCAST_DB_NAME)

    // Verify episode exists
    const episode = await db.collection('podcast-episodes').findOne({ id: episodeId })
    if (!episode) {
      await client.close()
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 })
    }

    // Verify course exists (check main courses collection)
    const course = await db.collection('courses').findOne({ 
      $or: [{ courseId }, { _id: new ObjectId(courseId) }] 
    })
    if (!course) {
      await client.close()
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check if link already exists
    const existingLink = await db.collection('podcast-course-links').findOne({
      episodeId,
      courseId
    })

    if (existingLink) {
      await client.close()
      return NextResponse.json(
        { error: 'Link between episode and course already exists' },
        { status: 409 }
      )
    }

    // Create the link
    const link: CoursePodcastLink = {
      episodeId,
      courseId,
      linkType,
      description,
      createdBy: userId,
      createdAt: new Date()
    }

    const result = await db.collection('podcast-course-links').insertOne(link)

    // Update episode with course information
    await db.collection('podcast-episodes').updateOne(
      { id: episodeId },
      { 
        $addToSet: { 
          linkedCourses: {
            courseId,
            courseName: course.courseName || course.name,
            linkType,
            description
          }
        },
        $set: { updatedAt: new Date() }
      }
    )

    await client.close()

    return NextResponse.json({
      success: true,
      linkId: result.insertedId,
      link: {
        ...link,
        _id: result.insertedId,
        courseName: course.courseName || course.name,
        episodeTitle: episode.title
      }
    })

  } catch (error) {
    console.error('Course-podcast linking error:', error)
    return NextResponse.json(
      { error: 'Failed to link course to podcast episode' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const episodeId = searchParams.get('episodeId')

    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    const db = client.db(PODCAST_DB_NAME)

    let query: any = {}
    if (courseId) query.courseId = courseId
    if (episodeId) query.episodeId = episodeId

    // Get links with episode and course details
    const links = await db.collection('podcast-course-links').aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'podcast-episodes',
          localField: 'episodeId',
          foreignField: 'id',
          as: 'episode'
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: 'courseId',
          as: 'course'
        }
      },
      {
        $project: {
          episodeId: 1,
          courseId: 1,
          linkType: 1,
          description: 1,
          createdAt: 1,
          episode: { $arrayElemAt: ['$episode', 0] },
          course: { $arrayElemAt: ['$course', 0] }
        }
      }
    ]).toArray()

    await client.close()

    return NextResponse.json({
      success: true,
      links
    })

  } catch (error) {
    console.error('Course-podcast links retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve course-podcast links' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { episodeId, courseId, linkId } = body

    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    const db = client.db(PODCAST_DB_NAME)

    let deleteQuery: any = {}
    if (linkId) {
      deleteQuery._id = new ObjectId(linkId)
    } else if (episodeId && courseId) {
      deleteQuery = { episodeId, courseId }
    } else {
      await client.close()
      return NextResponse.json(
        { error: 'Either linkId or both episodeId and courseId are required' },
        { status: 400 }
      )
    }

    // Remove the link
    const result = await db.collection('podcast-course-links').deleteOne(deleteQuery)

    if (result.deletedCount === 0) {
      await client.close()
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    // Remove course from episode's linkedCourses
    if (episodeId && courseId) {
      await db.collection('podcast-episodes').updateOne(
        { id: episodeId },
        { 
          $pull: { linkedCourses: { courseId: courseId } } as any,
          $set: { updatedAt: new Date() }
        }
      )
    }

    await client.close()

    return NextResponse.json({
      success: true,
      message: 'Course-podcast link removed successfully'
    })

  } catch (error) {
    console.error('Course-podcast link removal error:', error)
    return NextResponse.json(
      { error: 'Failed to remove course-podcast link' },
      { status: 500 }
    )
  }
}