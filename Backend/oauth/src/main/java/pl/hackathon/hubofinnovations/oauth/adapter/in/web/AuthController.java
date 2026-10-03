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
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticateGoogleUserUseCase authenticateUseCase;

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(@RequestBody GoogleLoginRequest request) {
        log.info("Received Google login attempt");

        var result = authenticateUseCase.authenticate(request.idToken());

        log.info("User logged in successfully: {}", result.user().email());
        return ResponseEntity.ok(new AuthResponse(
                result.internalJwt(),
                result.user().role().name()
        ));
    }
}