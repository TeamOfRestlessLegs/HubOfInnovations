package pl.hackathon.hubofinnovations.oauth.domain.port.out;

public interface GoogleTokenVerifier {
    GoogleUserInfo verifyAndGetInfo(String token);

    record GoogleUserInfo(String email, String name) {}
}