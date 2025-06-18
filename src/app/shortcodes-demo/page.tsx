// src/app/shortcodes-demo/page.tsx
import { YouTube, Figure, ImageGallery, QRCode } from '@/components/shortcodes';
import { BlogLayout } from '@/components/blog/BlogLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ShortcodesDemo() {
  return (
    <BlogLayout currentLang="en">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-primary mb-4">Hugo Shortcodes Demo</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Interactive demonstration of Hugo shortcodes converted to React components
          </p>

          <div className="space-y-8">
            {/* YouTube Demo */}
            <Card>
              <CardHeader>
                <CardTitle>YouTube Video Embed</CardTitle>
                <CardDescription>Privacy-enhanced YouTube embed with custom controls</CardDescription>
              </CardHeader>
              <CardContent>
                <YouTube 
                  id="dQw4w9WgXcQ" 
                  title="Demo Video"
                  privacy={true}
                />
              </CardContent>
            </Card>

            {/* Figure Demo */}
            <Card>
              <CardHeader>
                <CardTitle>Figure Component</CardTitle>
                <CardDescription>Enhanced image display with zoom and captions</CardDescription>
              </CardHeader>
              <CardContent>
                <Figure
                  src="https://picsum.photos/800/600?random=1"
                  alt="Technology workspace"
                  caption="Modern development environment"
                  width={800}
                  height={600}
                  zoom={true}
                />
              </CardContent>
            </Card>

            {/* Gallery Demo */}
            <Card>
              <CardHeader>
                <CardTitle>Image Gallery</CardTitle>
                <CardDescription>Interactive image gallery with navigation</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageGallery
                  images={[
                    "https://picsum.photos/600/400?random=2",
                    "https://picsum.photos/600/400?random=3",
                    "https://picsum.photos/600/400?random=4"
                  ]}
                  captions={["Programming", "Code", "Software"]}
                  height={400}
                />
              </CardContent>
            </Card>

            {/* QR Code Demo */}
            <Card>
              <CardHeader>
                <CardTitle>QR Code Generator</CardTitle>
                <CardDescription>Generate QR codes with customizable options</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <QRCode
                    text="https://github.com/milavdabgar"
                    size={200}
                    showDownload={true}
                    showCopy={true}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Usage Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Usage in Markdown</CardTitle>
                <CardDescription>How to use these shortcodes in your content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg font-mono text-sm space-y-2">
                  <div>{`{{< youtube "dQw4w9WgXcQ" >}}`}</div>
                  <div>{`{{< figure src="/image.jpg" alt="Description" caption="My Caption" >}}`}</div>
                  <div>{`{{< gallery images="img1.jpg,img2.jpg,img3.jpg" >}}`}</div>
                  <div>{`{{< qr text="https://example.com" size=200 >}}`}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </BlogLayout>
  );
}
