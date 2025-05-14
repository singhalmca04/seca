import { v2 as cloudinary } from 'cloudinary';

(async function () {
  // Configuration
  cloudinary.config({
    cloud_name: 'dnf95bknw',
    api_key: '765779528822428',
    api_secret: 'U8ot9_6nDCrGZ6vyXsLB_aCGXPY' // Click 'View API Keys' above to copy your API secret
  });

  // Upload an image
  const uploadResult = await cloudinary.uploader
    .upload(
      './students/RA2311003030131.jpg', {
      public_id: 'RA2311003030131',
    }
    )
    .catch((error) => {
      console.log(error);
    });

  console.log(uploadResult);

  // Optimize delivery by resizing and applying auto-format and auto-quality
  // const optimizeUrl = cloudinary.url('shoes', {
  //   fetch_format: 'auto',
  //   quality: 'auto'
  // });

  // console.log(optimizeUrl);

})();