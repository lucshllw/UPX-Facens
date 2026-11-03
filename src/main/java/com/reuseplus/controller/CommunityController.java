package com.reuseplus.controller;

import com.reuseplus.dto.ItemResponse;
import com.reuseplus.dto.MessageResponse;
import com.reuseplus.service.EngagementService;
import com.reuseplus.service.MessageService;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class CommunityController {
    private final EngagementService engagement;
    private final MessageService messages;
    public CommunityController(EngagementService engagement, MessageService messages) { this.engagement = engagement; this.messages = messages; }
    @GetMapping("/runtime")
    public Map<String, String> runtime() { return Map.of("mode", "server"); }
    @GetMapping("/me/favorites")
    public List<Long> favorites() { return engagement.favorites(); }
    @PutMapping("/me/favorites/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void saveFavorite(@PathVariable Long id) { engagement.favorite(id, true); }
    @DeleteMapping("/me/favorites/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeFavorite(@PathVariable Long id) { engagement.favorite(id, false); }
    @PostMapping("/items/{id}/reservation")
    public ItemResponse reserve(@PathVariable Long id) { return engagement.reserve(id); }
    @DeleteMapping("/items/{id}/reservation")
    public ItemResponse cancel(@PathVariable Long id) { return engagement.release(id); }
    @PostMapping("/items/{id}/complete")
    public ItemResponse complete(@PathVariable Long id) { return engagement.complete(id); }
    @GetMapping("/me/messages")
    public List<MessageResponse> inbox() { return messages.inbox(); }
}
