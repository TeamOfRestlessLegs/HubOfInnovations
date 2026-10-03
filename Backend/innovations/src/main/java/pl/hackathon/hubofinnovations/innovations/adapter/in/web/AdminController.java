package pl.hackathon.hubofinnovations.innovations.adapter.in.web;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.InnovationUseCase;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.ImportCommand;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.ImportResultDto;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final InnovationUseCase innovationUseCase;

    @PostMapping("/import")
    public ImportResultDto importData(@RequestBody ImportCommand command) {
        return innovationUseCase.importData(command);
    }
}