package com.personalfinance.manager.service;

import com.personalfinance.manager.dto.AccountDTO;
import com.personalfinance.manager.model.Account;

import java.util.List;

public interface AccountService {
    List<AccountDTO> getAllAccounts();
    AccountDTO getAccountById(Long id);
    AccountDTO createAccount(AccountDTO accountDTO);
    AccountDTO updateAccount(Long id, AccountDTO accountDTO);
    void deleteAccount(Long id);
    Account getAccountEntity(Long id);
}
