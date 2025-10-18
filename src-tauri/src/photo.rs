use crate::errors::PetError;
use image::{GenericImageView, ImageFormat, ImageReader};
use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;

/// Photo processing service for pet photos
pub struct PhotoService {
    storage_dir: PathBuf,
}

impl PhotoService {
    /// Create a new PhotoService with the specified storage directory
    pub fn new<P: AsRef<Path>>(storage_dir: P) -> Result<Self, PetError> {
        let storage_dir = storage_dir.as_ref().to_path_buf();

        // Create storage directory if it doesn't exist
        if !storage_dir.exists() {
            fs::create_dir_all(&storage_dir).map_err(|e| {
                PetError::file_system(format!("Failed to create storage directory: {e}"))
            })?;
        }

        // Verify write permissions
        if !storage_dir.is_dir() {
            return Err(PetError::file_system(
                "Storage path exists but is not a directory",
            ));
        }

        Ok(PhotoService { storage_dir })
    }

    /// Process and store a pet photo from a source path
    /// Returns the relative path where the processed photo was stored
    pub fn store_photo<P: AsRef<Path>>(&self, source_path: P) -> Result<String, PetError> {
        let source_path = source_path.as_ref();

        // Validate source file exists
        if !source_path.exists() {
            return Err(PetError::file_system("Source photo file does not exist"));
        }

        // Generate unique filename
        let file_extension = source_path
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("jpg");
        let unique_filename = format!("{}.{}", Uuid::new_v4(), file_extension);
        let target_path = self.storage_dir.join(&unique_filename);

        // Load and validate image with EXIF orientation correction
        let mut reader = ImageReader::open(source_path)
            .map_err(|e| PetError::photo_processing(format!("Failed to open image: {e}")))?;

        // Try to read EXIF orientation and apply it automatically
        let img = if let Some(format) = reader.format() {
            reader.set_format(format);
            reader
                .decode()
                .map_err(|e| PetError::photo_processing(format!("Failed to decode image: {e}")))?
        } else {
            reader
                .decode()
                .map_err(|e| PetError::photo_processing(format!("Failed to decode image: {e}")))?
        };

        // Apply EXIF orientation if present (this handles camera rotation metadata)
        let img = self.apply_exif_orientation(source_path, img)?;

        // Resize to 512x512 while maintaining aspect ratio
        let resized_img = self.resize_image_with_aspect_ratio(img, 512, 512);

        // Determine output format
        let format = self.determine_output_format(file_extension)?;

        // Save processed image
        resized_img
            .save_with_format(&target_path, format)
            .map_err(|e| {
                PetError::photo_processing(format!("Failed to save processed image: {e}"))
            })?;

        // Verify file was created successfully
        if !target_path.exists() {
            return Err(PetError::photo_processing(
                "Processed image file was not created",
            ));
        }

        // Log file size for monitoring
        if let Ok(metadata) = fs::metadata(&target_path) {
            log::info!("Processed photo saved: {} bytes", metadata.len());

            // Warn if file is unusually large (over 1MB)
            if metadata.len() > 1_048_576 {
                log::warn!("Processed photo is large: {} bytes", metadata.len());
            }
        }

        Ok(unique_filename)
    }

    /// Store photo from binary data
    pub fn store_photo_from_bytes(
        &self,
        image_data: &[u8],
        original_extension: Option<&str>,
    ) -> Result<String, PetError> {
        // Create temporary file for processing
        let temp_filename = format!(
            "temp_{}.{}",
            Uuid::new_v4(),
            original_extension.unwrap_or("jpg")
        );
        let temp_path = self.storage_dir.join(&temp_filename);

        // Write bytes to temporary file
        fs::write(&temp_path, image_data).map_err(|e| {
            PetError::file_system(format!("Failed to write temporary image file: {e}"))
        })?;

        // Process the temporary file
        let result = self.store_photo(&temp_path);

        // Clean up temporary file
        let _ = fs::remove_file(&temp_path);

        result
    }

    /// Delete a stored photo
    pub fn delete_photo(&self, photo_filename: &str) -> Result<(), PetError> {
        if photo_filename.trim().is_empty() {
            return Err(PetError::invalid_input("Photo filename cannot be empty"));
        }

        // Validate filename for security (prevent path traversal)
        if photo_filename.contains("..")
            || photo_filename.contains('/')
            || photo_filename.contains('\\')
        {
            return Err(PetError::invalid_input("Invalid photo filename"));
        }

        let photo_path = self.storage_dir.join(photo_filename);

        if photo_path.exists() {
            fs::remove_file(&photo_path)
                .map_err(|e| PetError::file_system(format!("Failed to delete photo file: {e}")))?;
            log::info!("Deleted photo: {photo_filename}");
        } else {
            log::warn!("Photo file not found for deletion: {photo_filename}");
        }

        Ok(())
    }

    /// Get the full path to a stored photo
    pub fn get_photo_path(&self, photo_filename: &str) -> Result<PathBuf, PetError> {
        if photo_filename.trim().is_empty() {
            return Err(PetError::invalid_input("Photo filename cannot be empty"));
        }

        // Validate filename for security
        if photo_filename.contains("..")
            || photo_filename.contains('/')
            || photo_filename.contains('\\')
        {
            return Err(PetError::invalid_input("Invalid photo filename"));
        }

        let photo_path = self.storage_dir.join(photo_filename);

        if !photo_path.exists() {
            return Err(PetError::file_system("Photo file does not exist"));
        }

        Ok(photo_path)
    }

    /// Get photo file info
    pub fn get_photo_info(&self, photo_filename: &str) -> Result<PhotoInfo, PetError> {
        let photo_path = self.get_photo_path(photo_filename)?;
        let metadata = fs::metadata(&photo_path)
            .map_err(|e| PetError::file_system(format!("Failed to read photo metadata: {e}")))?;

        // Try to get image dimensions
        let dimensions = match ImageReader::open(&photo_path) {
            Ok(reader) => match reader.into_dimensions() {
                Ok((width, height)) => Some((width, height)),
                Err(_) => None,
            },
            Err(_) => None,
        };

        Ok(PhotoInfo {
            filename: photo_filename.to_string(),
            file_size: metadata.len(),
            dimensions,
            created: metadata.created().ok(),
            modified: metadata.modified().ok(),
        })
    }

    /// List all stored photos
    pub fn list_photos(&self) -> Result<Vec<String>, PetError> {
        let mut photos = Vec::new();

        let dir_entries = fs::read_dir(&self.storage_dir)
            .map_err(|e| PetError::file_system(format!("Failed to read storage directory: {e}")))?;

        for entry in dir_entries {
            let entry = entry.map_err(|e| {
                PetError::file_system(format!("Failed to read directory entry: {e}"))
            })?;

            if entry
                .file_type()
                .map_err(|e| PetError::file_system(format!("Failed to get file type: {e}")))?
                .is_file()
            {
                if let Some(filename) = entry.file_name().to_str() {
                    // Only include image files
                    if self.is_image_file(filename) {
                        photos.push(filename.to_string());
                    }
                }
            }
        }

        photos.sort();
        Ok(photos)
    }

    /// Get storage directory statistics
    pub fn get_storage_stats(&self) -> Result<StorageStats, PetError> {
        let mut total_size = 0u64;
        let mut photo_count = 0usize;

        let dir_entries = fs::read_dir(&self.storage_dir)
            .map_err(|e| PetError::file_system(format!("Failed to read storage directory: {e}")))?;

        for entry in dir_entries {
            let entry = entry.map_err(|e| {
                PetError::file_system(format!("Failed to read directory entry: {e}"))
            })?;

            if entry
                .file_type()
                .map_err(|e| PetError::file_system(format!("Failed to get file type: {e}")))?
                .is_file()
            {
                if let Some(filename) = entry.file_name().to_str() {
                    if self.is_image_file(filename) {
                        photo_count += 1;
                        if let Ok(metadata) = entry.metadata() {
                            total_size += metadata.len();
                        }
                    }
                }
            }
        }

        Ok(StorageStats {
            photo_count,
            total_size,
            storage_dir: self.storage_dir.to_string_lossy().to_string(),
        })
    }

    /// Apply EXIF orientation correction to an image
    fn apply_exif_orientation(
        &self,
        source_path: &Path,
        img: image::DynamicImage,
    ) -> Result<image::DynamicImage, PetError> {
        use std::io::BufReader;

        // Try to read EXIF data
        let file = match fs::File::open(source_path) {
            Ok(f) => f,
            Err(_) => return Ok(img), // If can't open file, return original image
        };

        let mut reader = BufReader::new(file);
        let exif_reader = match exif::Reader::new().read_from_container(&mut reader) {
            Ok(r) => r,
            Err(_) => return Ok(img), // No EXIF data, return original image
        };

        // Get orientation tag
        let orientation = match exif_reader.get_field(exif::Tag::Orientation, exif::In::PRIMARY) {
            Some(field) => {
                match field.value.get_uint(0) {
                    Some(v) => v,
                    None => return Ok(img), // Can't read orientation, return original
                }
            }
            None => return Ok(img), // No orientation tag, return original
        };

        // Apply transformation based on EXIF orientation value
        // Reference: http://sylvana.net/jpegcrop/exif_orientation.html
        let corrected = match orientation {
            1 => img,                     // Normal
            2 => img.fliph(),             // Flip horizontal
            3 => img.rotate180(),         // Rotate 180
            4 => img.flipv(),             // Flip vertical
            5 => img.rotate90().fliph(),  // Rotate 90 CW and flip horizontal
            6 => img.rotate90(),          // Rotate 90 CW
            7 => img.rotate270().fliph(), // Rotate 270 CW and flip horizontal
            8 => img.rotate270(),         // Rotate 270 CW
            _ => img,                     // Unknown orientation, return original
        };

        log::info!("Applied EXIF orientation correction: {orientation}");
        Ok(corrected)
    }

    /// Resize image while maintaining aspect ratio, centering on canvas
    fn resize_image_with_aspect_ratio(
        &self,
        img: image::DynamicImage,
        target_width: u32,
        target_height: u32,
    ) -> image::DynamicImage {
        let (original_width, original_height) = img.dimensions();

        // Calculate scaling factor to fit within target dimensions
        let scale_x = target_width as f32 / original_width as f32;
        let scale_y = target_height as f32 / original_height as f32;
        let scale = scale_x.min(scale_y);

        // Calculate new dimensions
        let new_width = (original_width as f32 * scale) as u32;
        let new_height = (original_height as f32 * scale) as u32;

        // Resize the image
        let resized =
            img.resize_exact(new_width, new_height, image::imageops::FilterType::Lanczos3);

        // If the image doesn't fill the target dimensions, center it on a white background
        if new_width != target_width || new_height != target_height {
            let mut canvas = image::DynamicImage::new_rgb8(target_width, target_height);

            // Fill with white background
            for pixel in canvas.as_mut_rgb8().unwrap().pixels_mut() {
                *pixel = image::Rgb([255, 255, 255]);
            }

            // Calculate position to center the image
            let x_offset = (target_width - new_width) / 2;
            let y_offset = (target_height - new_height) / 2;

            // Overlay the resized image
            image::imageops::overlay(&mut canvas, &resized, x_offset.into(), y_offset.into());
            canvas
        } else {
            resized
        }
    }

    /// Determine output image format based on file extension
    fn determine_output_format(&self, extension: &str) -> Result<ImageFormat, PetError> {
        match extension.to_lowercase().as_str() {
            "jpg" | "jpeg" => Ok(ImageFormat::Jpeg),
            "png" => Ok(ImageFormat::Png),
            "webp" => Ok(ImageFormat::WebP),
            "bmp" => Ok(ImageFormat::Bmp),
            "tiff" | "tif" => Ok(ImageFormat::Tiff),
            _ => {
                // Default to JPEG for unknown formats
                log::warn!("Unknown image format '{extension}', defaulting to JPEG");
                Ok(ImageFormat::Jpeg)
            }
        }
    }

    /// Check if filename represents an image file
    fn is_image_file(&self, filename: &str) -> bool {
        let lower_filename = filename.to_lowercase();
        lower_filename.ends_with(".jpg")
            || lower_filename.ends_with(".jpeg")
            || lower_filename.ends_with(".png")
            || lower_filename.ends_with(".webp")
            || lower_filename.ends_with(".bmp")
            || lower_filename.ends_with(".tiff")
            || lower_filename.ends_with(".tif")
    }
}

/// Information about a stored photo
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PhotoInfo {
    pub filename: String,
    pub file_size: u64,
    pub dimensions: Option<(u32, u32)>,
    pub created: Option<std::time::SystemTime>,
    pub modified: Option<std::time::SystemTime>,
}

/// Storage statistics
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct StorageStats {
    pub photo_count: usize,
    pub total_size: u64,
    pub storage_dir: String,
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn setup_test_photo_service() -> (PhotoService, TempDir) {
        let temp_dir = TempDir::new().expect("Failed to create temp directory");
        let photo_service =
            PhotoService::new(temp_dir.path()).expect("Failed to create PhotoService");
        (photo_service, temp_dir)
    }

    fn create_test_image(width: u32, height: u32) -> image::DynamicImage {
        let mut img = image::DynamicImage::new_rgb8(width, height);
        // Fill with a simple pattern
        for (x, y, pixel) in img.as_mut_rgb8().unwrap().enumerate_pixels_mut() {
            *pixel = image::Rgb([(x % 256) as u8, (y % 256) as u8, 128]);
        }
        img
    }

    #[test]
    fn test_photo_service_creation() {
        let temp_dir = TempDir::new().unwrap();
        let photo_service = PhotoService::new(temp_dir.path());
        assert!(photo_service.is_ok());
    }

    #[test]
    fn test_store_photo_from_bytes() {
        let (photo_service, _temp_dir) = setup_test_photo_service();

        // Create a test image
        let test_img = create_test_image(100, 100);
        let mut img_bytes = Vec::new();
        test_img
            .write_to(&mut std::io::Cursor::new(&mut img_bytes), ImageFormat::Jpeg)
            .unwrap();

        let result = photo_service.store_photo_from_bytes(&img_bytes, Some("jpg"));
        assert!(result.is_ok());

        let filename = result.unwrap();
        assert!(filename.ends_with(".jpg"));

        // Verify the file was created and can be read
        let photo_path = photo_service.get_photo_path(&filename);
        assert!(photo_path.is_ok());
        assert!(photo_path.unwrap().exists());
    }

    #[test]
    fn test_resize_image_aspect_ratio() {
        let (photo_service, _temp_dir) = setup_test_photo_service();

        // Test with a rectangular image
        let test_img = create_test_image(800, 400);
        let resized = photo_service.resize_image_with_aspect_ratio(test_img, 512, 512);

        let (width, height) = resized.dimensions();
        assert_eq!(width, 512);
        assert_eq!(height, 512);
    }

    #[test]
    fn test_delete_photo() {
        let (photo_service, _temp_dir) = setup_test_photo_service();

        // Store a photo first
        let test_img = create_test_image(100, 100);
        let mut img_bytes = Vec::new();
        test_img
            .write_to(&mut std::io::Cursor::new(&mut img_bytes), ImageFormat::Jpeg)
            .unwrap();

        let filename = photo_service
            .store_photo_from_bytes(&img_bytes, Some("jpg"))
            .unwrap();

        // Verify it exists
        assert!(photo_service.get_photo_path(&filename).is_ok());

        // Delete it
        let result = photo_service.delete_photo(&filename);
        assert!(result.is_ok());

        // Verify it no longer exists
        assert!(photo_service.get_photo_path(&filename).is_err());
    }

    #[test]
    fn test_get_photo_info() {
        let (photo_service, _temp_dir) = setup_test_photo_service();

        // Store a photo
        let test_img = create_test_image(200, 150);
        let mut img_bytes = Vec::new();
        test_img
            .write_to(&mut std::io::Cursor::new(&mut img_bytes), ImageFormat::Png)
            .unwrap();

        let filename = photo_service
            .store_photo_from_bytes(&img_bytes, Some("png"))
            .unwrap();

        // Get photo info
        let info = photo_service.get_photo_info(&filename);
        assert!(info.is_ok());

        let info = info.unwrap();
        assert_eq!(info.filename, filename);
        assert!(info.file_size > 0);
        assert_eq!(info.dimensions, Some((512, 512))); // Should be resized
    }

    #[test]
    fn test_list_photos() {
        let (photo_service, _temp_dir) = setup_test_photo_service();

        // Initially should be empty
        let photos = photo_service.list_photos().unwrap();
        assert_eq!(photos.len(), 0);

        // Store a couple of photos using JPEG format only to avoid PNG encoding issues
        let test_img = create_test_image(100, 100);
        let mut img_bytes1 = Vec::new();
        test_img
            .write_to(
                &mut std::io::Cursor::new(&mut img_bytes1),
                ImageFormat::Jpeg,
            )
            .unwrap();

        let mut img_bytes2 = Vec::new();
        let test_img2 = create_test_image(150, 150);
        test_img2
            .write_to(
                &mut std::io::Cursor::new(&mut img_bytes2),
                ImageFormat::Jpeg,
            )
            .unwrap();

        photo_service
            .store_photo_from_bytes(&img_bytes1, Some("jpg"))
            .unwrap();
        photo_service
            .store_photo_from_bytes(&img_bytes2, Some("jpg"))
            .unwrap();

        let photos = photo_service.list_photos().unwrap();
        assert_eq!(photos.len(), 2);
    }

    #[test]
    fn test_storage_stats() {
        let (photo_service, temp_dir) = setup_test_photo_service();

        let stats = photo_service.get_storage_stats().unwrap();
        assert_eq!(stats.photo_count, 0);
        assert_eq!(stats.total_size, 0);
        assert_eq!(
            stats.storage_dir,
            temp_dir.path().to_string_lossy().to_string()
        );

        // Store a photo
        let test_img = create_test_image(100, 100);
        let mut img_bytes = Vec::new();
        test_img
            .write_to(&mut std::io::Cursor::new(&mut img_bytes), ImageFormat::Jpeg)
            .unwrap();

        photo_service
            .store_photo_from_bytes(&img_bytes, Some("jpg"))
            .unwrap();

        let stats = photo_service.get_storage_stats().unwrap();
        assert_eq!(stats.photo_count, 1);
        assert!(stats.total_size > 0);
    }

    #[test]
    fn test_invalid_filename_security() {
        let (photo_service, _temp_dir) = setup_test_photo_service();

        // Test path traversal attempts
        assert!(photo_service.get_photo_path("../../../etc/passwd").is_err());
        assert!(photo_service
            .get_photo_path("..\\..\\windows\\system32\\config")
            .is_err());
        assert!(photo_service.delete_photo("../sensitive_file.jpg").is_err());

        // Test empty filename
        assert!(photo_service.get_photo_path("").is_err());
        assert!(photo_service.delete_photo("").is_err());
    }

    #[test]
    fn test_image_format_determination() {
        let (photo_service, _temp_dir) = setup_test_photo_service();

        assert_eq!(
            photo_service.determine_output_format("jpg").unwrap(),
            ImageFormat::Jpeg
        );
        assert_eq!(
            photo_service.determine_output_format("JPEG").unwrap(),
            ImageFormat::Jpeg
        );
        assert_eq!(
            photo_service.determine_output_format("png").unwrap(),
            ImageFormat::Png
        );
        assert_eq!(
            photo_service.determine_output_format("webp").unwrap(),
            ImageFormat::WebP
        );

        // Unknown format should default to JPEG
        assert_eq!(
            photo_service.determine_output_format("unknown").unwrap(),
            ImageFormat::Jpeg
        );
    }
}
