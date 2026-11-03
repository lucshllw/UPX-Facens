package com.reuseplus.repository;

import com.reuseplus.domain.Item;
import com.reuseplus.domain.ItemType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ItemRepository extends JpaRepository<Item, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from Item i where i.id = :id")
    java.util.Optional<Item> findLockedById(@Param("id") Long id);
    @Query("""
            select i from Item i
            join fetch i.owner
            join fetch i.category
            where (:categoryId is null or i.category.id = :categoryId)
              and (:type is null or i.type = :type)
              and (:query is null
                   or lower(i.title) like lower(concat('%', :query, '%'))
                   or lower(i.description) like lower(concat('%', :query, '%')))
            order by i.createdAt desc
            """)
    List<Item> search(@Param("categoryId") Long categoryId,
                      @Param("type") ItemType type,
                      @Param("query") String query);
}
