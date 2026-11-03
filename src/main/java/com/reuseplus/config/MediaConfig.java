package com.reuseplus.config;
import java.nio.file.Path;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class MediaConfig implements WebMvcConfigurer {
    private final String location;
    public MediaConfig(@Value("${app.upload-directory:./.reuse-data/uploads}") String directory) { this.location = Path.of(directory).toAbsolutePath().normalize().toUri().toString() + "/"; }
    @Override public void addResourceHandlers(ResourceHandlerRegistry registry) { registry.addResourceHandler("/uploads/**").addResourceLocations(location); }
}
