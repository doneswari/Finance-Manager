package com.personalfinance.manager.controller;

import com.personalfinance.manager.dto.RecurringExpenseDTO;
import com.personalfinance.manager.dto.TransactionDTO;
import com.personalfinance.manager.service.RecurringExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recurring-expenses")
public class RecurringExpenseController {

    private final RecurringExpenseService recurringExpenseService;

    public RecurringExpenseController(RecurringExpenseService recurringExpenseService) {
        this.recurringExpenseService = recurringExpenseService;
    }

    @GetMapping
    public ResponseEntity<List<RecurringExpenseDTO>> getAllRecurringExpenses() {
        return ResponseEntity.ok(recurringExpenseService.getAllRecurringExpenses());
    }

    @PostMapping
    public ResponseEntity<RecurringExpenseDTO> createRecurringExpense(@Valid @RequestBody RecurringExpenseDTO dto) {
        return new ResponseEntity<>(recurringExpenseService.createRecurringExpense(dto), HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecurringExpense(@PathVariable Long id) {
        recurringExpenseService.deleteRecurringExpense(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<TransactionDTO> payRecurringExpense(@PathVariable Long id) {
        return ResponseEntity.ok(recurringExpenseService.payRecurringExpense(id));
    }
}
