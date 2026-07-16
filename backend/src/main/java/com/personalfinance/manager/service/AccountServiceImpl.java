package com.personalfinance.manager.service;

import com.personalfinance.manager.dto.AccountDTO;
import com.personalfinance.manager.exception.ResourceNotFoundException;
import com.personalfinance.manager.model.Account;
import com.personalfinance.manager.model.User;
import com.personalfinance.manager.repository.AccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AccountServiceImpl implements AccountService {

    private final AccountRepository accountRepository;
    private final UserService userService;

    public AccountServiceImpl(AccountRepository accountRepository, UserService userService) {
        this.accountRepository = accountRepository;
        this.userService = userService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AccountDTO> getAllAccounts() {
        User currentUser = userService.getCurrentUser();
        return accountRepository.findByUserId(currentUser.getId()).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AccountDTO getAccountById(Long id) {
        Account account = getAccountEntity(id);
        return convertToDTO(account);
    }

    @Override
    @Transactional
    public AccountDTO createAccount(AccountDTO accountDTO) {
        User currentUser = userService.getCurrentUser();
        Account account = Account.builder()
                .name(accountDTO.getName())
                .type(accountDTO.getType())
                .balance(accountDTO.getBalance())
                .currency(accountDTO.getCurrency())
                .user(currentUser)
                .build();
        
        return convertToDTO(accountRepository.save(account));
    }

    @Override
    @Transactional
    public AccountDTO updateAccount(Long id, AccountDTO accountDTO) {
        Account account = getAccountEntity(id);
        account.setName(accountDTO.getName());
        account.setType(accountDTO.getType());
        account.setBalance(accountDTO.getBalance());
        account.setCurrency(accountDTO.getCurrency());
        
        return convertToDTO(accountRepository.save(account));
    }

    @Override
    @Transactional
    public void deleteAccount(Long id) {
        Account account = getAccountEntity(id);
        accountRepository.delete(account);
    }

    @Override
    @Transactional(readOnly = true)
    public Account getAccountEntity(Long id) {
        User currentUser = userService.getCurrentUser();
        return accountRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + id));
    }

    private AccountDTO convertToDTO(Account account) {
        return AccountDTO.builder()
                .id(account.getId())
                .name(account.getName())
                .type(account.getType())
                .balance(account.getBalance())
                .currency(account.getCurrency())
                .build();
    }
}
