import cloudinary from 'cloudinary';

// eslint-disable-next-line import/prefer-default-export
export const uploadAvatar = (userId, stream) => new Promise((resolve, reject) => {
  const outStream = cloudinary.v2.uploader.upload_stream(
    {
      upload_preset: 'avatar',
      public_id: userId,
    },
    (err, res) => {
      if (err) {
        return reject(err);
      }
      return resolve(cloudinary.v2.url(res.public_id, { secure: true, fetch_format: 'auto' }));
    },
  );
  stream.pipe(outStream);
});
