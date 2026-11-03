package com.reuseplus.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "messages")
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id")
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id")
    private AppUser sender;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "receiver_id")
    private AppUser receiver;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Message() {
    }

    public Message(Item item, AppUser sender, AppUser receiver, String content) {
        this.item = item;
        this.sender = sender;
        this.receiver = receiver;
        this.content = content;
    }

    @PrePersist
    void prePersist() {
        createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Item getItem() {
        return item;
    }

    public AppUser getSender() {
        return sender;
    }

    public AppUser getReceiver() {
        return receiver;
    }

    public String getContent() {
        return content;
    }

    public Instant getReadAt() {
        return readAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
