// AWS S3 Client mock
const mockS3Client = {
  send: jest.fn().mockResolvedValue({
    $metadata: { httpStatusCode: 200 },
    Location: 'https://bucket.s3.amazonaws.com/key',
    ETag: '"d41d8cd98f00b204e9800998ecf8427e"',
  }),
};

const S3Client = jest.fn().mockImplementation(() => mockS3Client);

const PutObjectCommand = jest.fn().mockImplementation((params) => ({ input: params }));
const GetObjectCommand = jest.fn().mockImplementation((params) => ({ input: params }));
const DeleteObjectCommand = jest.fn().mockImplementation((params) => ({ input: params }));

module.exports = {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
};
