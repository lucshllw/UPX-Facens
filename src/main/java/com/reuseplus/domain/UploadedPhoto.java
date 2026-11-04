package com.reuseplus.domain;

import jakarta.persistence.*;

/** Small community photos can use SQL storage on hosts without persistent disks. */
@Entity
@Table(name = "uploaded_photos")
public class UploadedPhoto {
    @Id @Column(length = 64) private String name;
    @Column(nullable = false, columnDefinition = "bytea") private byte[] content;
    protected UploadedPhoto() {}
    public UploadedPhoto(String name, byte[] content) { this.name = name; this.content = content; }
    public String getName() { return name; }
    public byte[] getContent() { return content; }
}
