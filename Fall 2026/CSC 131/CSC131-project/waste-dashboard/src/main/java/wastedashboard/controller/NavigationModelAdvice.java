package wastedashboard.controller;

import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

import java.security.Principal;

@ControllerAdvice
public class NavigationModelAdvice {

    @ModelAttribute("adminLoggedIn")
    public boolean adminLoggedIn(Principal principal) {
        return principal != null;
    }
}
