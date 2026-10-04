package pl.hackathon.hubofinnovations.innovations.domain.port.out;

public interface InnovationTesterRepository {
    boolean exists(String innovationId);
    void saveTester(String innovationId);
}