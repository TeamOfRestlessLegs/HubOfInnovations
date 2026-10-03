package pl.hackathon.hubofinnovations.innovations.adapter.in.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.InnovationUseCase;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.CategoryDto;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.UpsertCategoryCommand;
import pl.hackathon.hubofinnovations.innovations.domain.port.out.CategoryRepository;
import pl.hackathon.hubofinnovations.innovations.domain.port.out.InnovationRepository;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CategoryController.class)
class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private InnovationUseCase innovationUseCase;

    @MockitoBean
    private CategoryRepository categoryRepository;

    @MockitoBean
    private InnovationRepository innovationRepository;

    @Test
    void shouldReturnAllCategories() throws Exception {
        // given
        when(innovationUseCase.getAllCategories()).thenReturn(List.of(
                new CategoryDto("kat-1", "Kategoria 1", "url1", 5),
                new CategoryDto("kat-2", "Kategoria 2", "url2", 0)
        ));

        // when & then
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(2))
                .andExpect(jsonPath("$[0].slug").value("kat-1"))
                .andExpect(jsonPath("$[0].innovationCount").value(5));
    }

    @Test
    void shouldCreateCategoryAndReturn201() throws Exception {
        // given
        UpsertCategoryCommand cmd = new UpsertCategoryCommand("nowa-kat", "Nowa", "url");
        when(innovationUseCase.createCategory(any(UpsertCategoryCommand.class)))
                .thenReturn(new CategoryDto("nowa-kat", "Nowa", "url", 0));

        // when & then
        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cmd)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.slug").value("nowa-kat"));
    }
}