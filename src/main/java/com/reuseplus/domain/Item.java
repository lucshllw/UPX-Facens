package com.reuseplus.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "items")
public class Item {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id")
    private AppUser owner;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ItemType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ItemStatus status = ItemStatus.AVAILABLE;

    @Column(name = "condition_label", length = 60)
    private String conditionLabel;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(length = 120)
    private String location;

    @Column(name = "gallery_urls", columnDefinition = "TEXT")
    private String galleryUrls;

    @Column(name = "reserved_by_id")
    private Long reservedById;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Item() {
    }

    public Item(AppUser owner, Category category, String title, String description, ItemType type,
                String conditionLabel, String imageUrl) {
        this.owner = owner;
        this.category = category;
        this.title = title;
        this.description = description;
        this.type = type;
        this.conditionLabel = conditionLabel;
        this.imageUrl = imageUrl;
    }

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }

    public void update(Category category, String title, String description, ItemType type,
                       ItemStatus status, String conditionLabel, String imageUrl) {
        this.category = category;
        this.title = title;
        this.description = description;
        this.type = type;
        this.status = status;
        this.conditionLabel = conditionLabel;
        this.imageUrl = imageUrl;
    }

    public Long getId() {
        return id;
    }

    public String getLocation() { return location; }
    public java.util.List<String> getImageUrls() {
        return galleryUrls == null || galleryUrls.isBlank()
                ? (imageUrl == null || imageUrl.isBlank() ? java.util.List.of() : java.util.List.of(imageUrl))
                : java.util.Arrays.asList(galleryUrls.split("\n"));
    }
    public Long getReservedById() { return reservedById; }
    public void updateGallery(String location, java.util.List<String> images) {
        this.location = location;
        this.galleryUrls = images == null ? null : String.join("\n", images);
    }
    public void reserve(Long userId) { this.status = ItemStatus.RESERVED; this.reservedById = userId; }
    public void release() { this.status = ItemStatus.AVAILABLE; this.reservedById = null; }
    public void complete() { this.status = ItemStatus.FINISHED; }

    public AppUser getOwner() {
        return owner;
    }

    public Category getCategory() {
        return category;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public ItemType getType() {
        return type;
    }

    public ItemStatus getStatus() {
        return status;
    }

    public String getConditionLabel() {
        return conditionLabel;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
