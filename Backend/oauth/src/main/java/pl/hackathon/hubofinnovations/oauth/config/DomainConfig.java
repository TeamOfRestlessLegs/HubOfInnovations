package pl.hackathon.hubofinnovations.oauth.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import pl.hackathon.hubofinnovations.oauth.domain.port.in.AuthenticateGoogleUserUseCase;
import pl.hackathon.hubofinnovations.oauth.domain.port.out.GoogleTokenVerifier;
import pl.hackathon.hubofinnovations.oauth.domain.port.out.InternalJwtGenerator;
import pl.hackathon.hubofinnovations.oauth.domain.port.out.UserRepository;
import pl.hackathon.hubofinnovations.oauth.domain.service.AuthService;

@Configuration
public class DomainConfig {

    @Bean
    public AuthenticateGoogleUserUseCase authenticateGoogleUserUseCase(
            GoogleTokenVerifier googleVerifier,
            UserRepository userRepository,
            InternalJwtGenerator jwtGenerator) {

        return new AuthService(googleVerifier, userRepository, jwtGenerator);
    }
}