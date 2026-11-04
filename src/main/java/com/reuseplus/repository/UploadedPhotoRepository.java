package com.reuseplus.repository;
import com.reuseplus.domain.UploadedPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
public interface UploadedPhotoRepository extends JpaRepository<UploadedPhoto, String> {}
