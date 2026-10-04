package pl.hackathon.hubofinnovations.innovations.adapter.in.web;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.InnovationUseCase;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.TestResultDto;

import java.time.LocalDateTime;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(InnovationController.class)
class InnovationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private InnovationUseCase innovationUseCase;

    @Test
    void shouldJoinAsTesterAndReturn201() throws Exception {
        // given
        String categorySlug = "edukacja";
        String slug = "aplikacja-szkolna";
        Long userId = 42L;

        doNothing().when(innovationUseCase).joinAsTester(categorySlug, slug);

        // when & then
        mockMvc.perform(post("/api/innovations/{categorySlug}/{slug}/testers", categorySlug, slug)
                        )
                .andExpect(status().isCreated());

        verify(innovationUseCase, times(1)).joinAsTester(categorySlug, slug);
    }

    @Test
    void shouldRunTestsAndReturn200WithResult() throws Exception {
        // given
        String categorySlug = "edukacja";
        String slug = "aplikacja-szkolna";
        String id = categorySlug + "/" + slug;

        TestResultDto expectedResult = new TestResultDto(
                id, "SUCCESS", "Wszystkie testy innowacji przebiegły pomyślnie.", LocalDateTime.now()
        );

        when(innovationUseCase.runTests(categorySlug, slug)).thenReturn(expectedResult);

        // when & then
        mockMvc.perform(post("/api/innovations/{categorySlug}/{slug}/tests/run", categorySlug, slug))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.innovationId").value(id))

                .andExpect(jsonPath("$.status").value("SUCCESS"));
    }
}