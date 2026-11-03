package com.reuseplus.controller;

import com.reuseplus.exception.ApiException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class UploadController {
    private final Path directory;
    public UploadController(@Value("${app.upload-directory:./.reuse-data/uploads}") String directory) { this.directory = Path.of(directory).toAbsolutePath().normalize(); }

    @PostMapping("/api/uploads") @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty() || file.getSize() > 8 * 1024 * 1024) throw new ApiException(HttpStatus.BAD_REQUEST, "Adicione uma foto de ate 8 MB.");
        byte[] bytes = file.getBytes();
        String extension = null;
        if (bytes.length > 12 && bytes[0] == (byte) 0xFF && bytes[1] == (byte) 0xD8 && bytes[2] == (byte) 0xFF) extension = "jpg";
        if (bytes.length > 24 && bytes[0] == (byte) 0x89 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G') extension = "png";
        if (bytes.length > 24 && new String(bytes, 0, 4, java.nio.charset.StandardCharsets.US_ASCII).equals("RIFF") && new String(bytes, 8, 4, java.nio.charset.StandardCharsets.US_ASCII).equals("WEBP")) extension = "webp";
        if (extension == null) throw new ApiException(HttpStatus.BAD_REQUEST, "Formato invalido. Use JPG, PNG ou WebP.");
        Files.createDirectories(directory);
        String name = UUID.randomUUID() + "." + extension;
        Files.write(directory.resolve(name), bytes);
        return Map.of("url", "/uploads/" + name);
    }
}
