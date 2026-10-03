package pl.hackathon.hubofinnovations.oauth.domain.service;

import lombok.RequiredArgsConstructor;
import pl.hackathon.hubofinnovations.oauth.domain.model.AuthResult;
import pl.hackathon.hubofinnovations.oauth.domain.model.User;
import pl.hackathon.hubofinnovations.oauth.domain.port.in.AuthenticateGoogleUserUseCase;
import pl.hackathon.hubofinnovations.oauth.domain.port.out.GoogleTokenVerifier;
import pl.hackathon.hubofinnovations.oauth.domain.port.out.InternalJwtGenerator;
import pl.hackathon.hubofinnovations.oauth.domain.port.out.UserRepository;

@RequiredArgsConstructor
public class AuthService implements AuthenticateGoogleUserUseCase {

    private final GoogleTokenVerifier googleVerifier;
    private final UserRepository userRepository;
    private final InternalJwtGenerator jwtGenerator;

    @Override
    public AuthResult authenticate(String googleIdToken) {

        var googleInfo = googleVerifier.verifyAndGetInfo(googleIdToken);
        if (googleInfo == null) {
            throw new IllegalArgumentException("Invalid or expired Google token");
        }

        User user = userRepository.findByEmail(googleInfo.email())
                .orElseGet(() -> {
                    User newUser = User.createNewResident(googleInfo.email(), googleInfo.name());
                    return userRepository.save(newUser);
                });

        String token = jwtGenerator.generate(user);

        return new AuthResult(token, user);
    }
}