package pl.hackathon.hubofinnovations.innovations;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class InnovationsApplication {
    public static void main(String[] args) {
        SpringApplication.run(InnovationsApplication.class, args);
    }
}
