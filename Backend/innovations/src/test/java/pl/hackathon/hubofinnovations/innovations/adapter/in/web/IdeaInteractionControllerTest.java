package pl.hackathon.hubofinnovations.innovations.adapter.in.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.IdeaInteractionUseCase;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.CommentCommand;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.CommentDto;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(IdeaInteractionController.class)
class IdeaInteractionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private IdeaInteractionUseCase interactionUseCase;

    @Test
    void shouldReturnCommentsForIdea() throws Exception {
        // given
        List<CommentDto> comments = List.of(
                new CommentDto(1L, 100L, 2L, "discussion", "Komentarz 1", LocalDateTime.now()),
                new CommentDto(2L, 100L, 3L, "discussion", "Komentarz 2", LocalDateTime.now())
        );
        when(interactionUseCase.getComments(100L, "discussion")).thenReturn(comments);

        // when & then
        mockMvc.perform(get("/api/ideas/100/comments?section=discussion"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(2))
                .andExpect(jsonPath("$[0].body").value("Komentarz 1"))
                .andExpect(jsonPath("$[1].authorId").value(3));
    }

    @Test
    void shouldAddCommentAndReturn201() throws Exception {
        // given
        CommentCommand command = new CommentCommand("Nowy wpis");
        CommentDto expectedResponse = new CommentDto(10L, 100L, 5L, "discussion", "Nowy wpis", LocalDateTime.now());

        when(interactionUseCase.addComment(eq(100L), eq("discussion"), any(CommentCommand.class), eq(5L)))
                .thenReturn(expectedResponse);

        // when & then
        mockMvc.perform(post("/api/ideas/100/comments")
                        .header("X-User-Id", 5L)
                        .param("section", "discussion")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(command)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.body").value("Nowy wpis"))
                .andExpect(jsonPath("$.authorId").value(5));
    }
}