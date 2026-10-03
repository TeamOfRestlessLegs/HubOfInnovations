package pl.hackathon.hubofinnovations.innovations.adapter.in.web;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.InnovationUseCase;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/innovations")
@RequiredArgsConstructor
public class InnovationController {

    private final InnovationUseCase innovationUseCase;

    @GetMapping
    public Page<InnovationSummaryDto> getInnovations(
            @RequestParam(required = false) String category,
            Pageable pageable) {
        return innovationUseCase.getInnovations(category, pageable);
    }

    @GetMapping("/{categorySlug}/{slug}")
    public InnovationDetailsDto getInnovation(@PathVariable String categorySlug, @PathVariable String slug) {
        return innovationUseCase.getInnovation(categorySlug, slug);
    }

    @PostMapping("/by-ids")
    public List<InnovationSummaryDto> getInnovationsByIds(@RequestBody Map<String, List<String>> request) {
        return innovationUseCase.getInnovationsByIds(request.get("ids"));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InnovationDetailsDto createInnovation(@RequestBody UpsertInnovationCommand command) {
        return innovationUseCase.createInnovation(command);
    }

    @PutMapping("/{categorySlug}/{slug}")
    public InnovationDetailsDto updateInnovation(
            @PathVariable String categorySlug,
            @PathVariable String slug,
            @RequestBody UpsertInnovationCommand command) {
        return innovationUseCase.updateInnovation(categorySlug, slug, command);
    }

    @DeleteMapping("/{categorySlug}/{slug}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteInnovation(@PathVariable String categorySlug, @PathVariable String slug) {
        innovationUseCase.deleteInnovation(categorySlug, slug);
    }

    @GetMapping("/{categorySlug}/{slug}/files")
    public List<InnovationFileDto> getFiles(
            @PathVariable String categorySlug,
            @PathVariable String slug,
            @RequestParam(required = false) String kind,
            @RequestParam(required = false) Boolean pdfReadable) {
        return innovationUseCase.getFiles(categorySlug, slug, kind, pdfReadable);
    }

    @PutMapping("/{categorySlug}/{slug}/files")
    public List<InnovationFileDto> replaceFiles(
            @PathVariable String categorySlug,
            @PathVariable String slug,
            @RequestBody List<FileCommand> files) {
        return innovationUseCase.replaceFiles(categorySlug, slug, files);
    }

    @DeleteMapping("/{categorySlug}/{slug}/files/{fileId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteFile(
            @PathVariable String categorySlug,
            @PathVariable String slug,
            @PathVariable long fileId) {
        innovationUseCase.deleteFile(categorySlug, slug, fileId);
    }
}