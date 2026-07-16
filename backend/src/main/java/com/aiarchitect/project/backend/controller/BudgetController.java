package com.aiarchitect.project.backend.controller;

import com.aiarchitect.project.backend.model.Task;
import com.aiarchitect.project.backend.repository.TaskRepository;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/budget")
@CrossOrigin(origins = "*")
public class BudgetController {

    private final TaskRepository taskRepository;

    public BudgetController(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    // 🔥 GET MONTHLY BUDGET
    @GetMapping("/{projectId}")
    public Map<String, Double> getBudget(@PathVariable Long projectId) {

        List<Task> tasks = taskRepository.findByProjectId(projectId);

        Map<String, Double> monthly = new LinkedHashMap<>();

        for (Task t : tasks) {

            if (t.getStartDate() != null && t.getCost() > 0) {

                String month = t.getStartDate().getMonth().toString();

                monthly.put(month,
                        monthly.getOrDefault(month, 0.0) + t.getCost());
            }
        }

        return monthly;
    }
}