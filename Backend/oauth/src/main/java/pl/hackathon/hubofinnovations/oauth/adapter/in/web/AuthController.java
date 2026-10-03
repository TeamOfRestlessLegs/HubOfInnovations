package pl.hackathon.hubofinnovations.oauth.adapter.in.web;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.hackathon.hubofinnovations.oauth.adapter.in.web.dto.AuthResponse;
import pl.hackathon.hubofinnovations.oauth.adapter.in.web.dto.GoogleLoginRequest;
import pl.hackathon.hubofinnovations.oauth.domain.port.in.AuthenticateGoogleUserUseCase;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticateGoogleUserUseCase authenticateUseCase;

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(@RequestBody GoogleLoginRequest request) {
        log.info("Received Google login attempt");

        var result = authenticateUseCase.authenticate(request.credential());

        log.info("User logged in successfully: {}", result.user().email());

        return ResponseEntity.ok(new AuthResponse(
                result.user().id().toString(),
                result.user().name(),
                result.user().email(),
                result.user().role().name().toLowerCase(),
                result.internalJwt()
        ));
    }
}