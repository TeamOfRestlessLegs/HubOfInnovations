package pl.hackathon.hubofinnovations.innovations.adapter.in.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import pl.hackathon.hubofinnovations.innovations.domain.model.IdeaStatus;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.IdeaUseCase;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.CreateIdeaCommand;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.IdeaDto;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.RejectIdeaCommand;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(IdeaController.class)
class IdeaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private IdeaUseCase ideaUseCase;

    @Test
    void shouldCreateIdeaAndReturn201() throws Exception {
        // given
        CreateIdeaCommand cmd = new CreateIdeaCommand(
                1L, false, "Moja innowacja", "Brak dostępu", "Młodzież", "Krótki opis", "Nowe podejście"
        );

        IdeaDto expectedResponse = new IdeaDto(
                10L, 1L, null, false, "Brak dostępu", "Młodzież", "Moja innowacja",
                "Krótki opis", 1, "Nowe podejście", IdeaStatus.PENDING_REVIEW,
                null, null, null, false, null, null
        );

        when(ideaUseCase.createIdea(any(CreateIdeaCommand.class), anyLong())).thenReturn(expectedResponse);

        // when & then
        mockMvc.perform(post("/api/ideas")
                        .header("X-User-Id", 1L) // Zmiana: Kontroler wymaga nagłówka autoryzacji
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cmd)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.title").value("Moja innowacja"))
                .andExpect(jsonPath("$.status").value("PENDING_REVIEW"));
    }

    @Test
    void shouldRejectIdeaAndReturn200() throws Exception {
        // given
        String rejectReason = "Brak budżetu";
        RejectIdeaCommand cmd = new RejectIdeaCommand(rejectReason); // Zmiana: Odrzucenie używa DTO, a nie czystego Stringa

        IdeaDto expectedResponse = new IdeaDto(
                10L, 1L, null, false, "Problem", "Grupa", "Tytuł",
                "Opis", 1, "Nowość", IdeaStatus.REJECTED,
                rejectReason, null, null, false, null, null
        );

        when(ideaUseCase.rejectIdea(eq(10L), eq(rejectReason), anyLong())).thenReturn(expectedResponse);

        // when & then
        mockMvc.perform(post("/api/ideas/10/reject")
                        .header("X-User-Id", 99L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cmd)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.rejectReason").value(rejectReason));
    }
}