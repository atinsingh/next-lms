import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { auth } from '@clerk/nextjs/server';
import { isTeacher } from '@/lib/teacher';

const f = createUploadthing();

const handleAuth = async () => {
  const { userId } = await auth();
  const isAuthorized = isTeacher(userId);

  if (!userId || !isAuthorized) throw new Error('Unauthorized');
  return { userId };
};

export const ourFileRouter = {
  courseImage: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),
    
  courseAttachment: f({
    pdf: { maxFileSize: '16MB', maxFileCount: 10 },
    'application/zip': { maxFileSize: '128MB', maxFileCount: 5 },
  })
    .middleware(() => handleAuth())
    .onUploadComplete(({ file }) => {
      // console.log('File uploaded successfully:', file);
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
