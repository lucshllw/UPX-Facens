package com.reuseplus.repository;

import com.reuseplus.domain.Message;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MessageRepository extends JpaRepository<Message, Long> {
    @Query("select m from Message m join fetch m.sender join fetch m.receiver join fetch m.item where m.sender.id = :userId or m.receiver.id = :userId order by m.createdAt desc")
    List<Message> findInbox(@Param("userId") Long userId);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @Query("update Message m set m.readAt = :now where m.item.id = :itemId and m.receiver.id = :userId and m.sender.id = :peerId and m.readAt is null")
    int markRead(@Param("itemId") Long itemId, @Param("userId") Long userId,
                 @Param("peerId") Long peerId, @Param("now") java.time.Instant now);

    boolean existsByItemIdAndSenderIdAndReceiverId(Long itemId, Long senderId, Long receiverId);
    @Query("""
            select m from Message m
            join fetch m.sender
            join fetch m.receiver
            join fetch m.item i
            where i.id = :itemId
              and (i.owner.id = :userId or m.sender.id = :userId or m.receiver.id = :userId)
            order by m.createdAt asc
            """)
    List<Message> findVisibleForItem(@Param("itemId") Long itemId, @Param("userId") Long userId);
}
