use crate::database::{ActivityCategory, ActivityCreateRequest, ActivityUpdateRequest};
use crate::errors::ActivityError;
use chrono::Utc;

/// Validate activity creation request
pub fn validate_activity_create_request(
    request: &ActivityCreateRequest,
) -> Result<(), ActivityError> {
    // Validate pet_id
    if request.pet_id <= 0 {
        return Err(ActivityError::validation(
            "pet_id",
            "Pet ID must be positive",
        ));
    }

    // Validate title
    if request.title.trim().is_empty() {
        return Err(ActivityError::validation("title", "Title cannot be empty"));
    }

    if request.title.len() > 255 {
        return Err(ActivityError::validation(
            "title",
            "Title must be 255 characters or less",
        ));
    }

    // Validate subcategory
    if request.subcategory.trim().is_empty() {
        return Err(ActivityError::validation(
            "subcategory",
            "Subcategory cannot be empty",
        ));
    }

    if request.subcategory.len() > 100 {
        return Err(ActivityError::validation(
            "subcategory",
            "Subcategory must be 100 characters or less",
        ));
    }

    // Validate description length if provided
    if let Some(ref description) = request.description {
        if description.len() > 2000 {
            return Err(ActivityError::validation(
                "description",
                "Description must be 2000 characters or less",
            ));
        }
    }

    // Validate activity date is not too far in the future
    let now = Utc::now();
    let one_year_future = now + chrono::Duration::days(365);

    if request.activity_date > one_year_future {
        return Err(ActivityError::date_out_of_range(
            "Activity date cannot be more than 1 year in the future",
        ));
    }

    // Validate activity date is not too far in the past (arbitrary limit for data integrity)
    let ten_years_past = now - chrono::Duration::days(3650);

    if request.activity_date < ten_years_past {
        return Err(ActivityError::date_out_of_range(
            "Activity date cannot be more than 10 years in the past",
        ));
    }

    // Validate cost if provided
    if let Some(cost) = request.cost {
        if cost < 0.0 {
            return Err(ActivityError::validation("cost", "Cost cannot be negative"));
        }

        if cost > 999999.99 {
            return Err(ActivityError::validation(
                "cost",
                "Cost cannot exceed 999,999.99",
            ));
        }
    }

    // Validate currency if provided
    if let Some(ref currency) = request.currency {
        if currency.trim().is_empty() {
            return Err(ActivityError::validation(
                "currency",
                "Currency cannot be empty if specified",
            ));
        }

        if currency.len() > 10 {
            return Err(ActivityError::validation(
                "currency",
                "Currency code must be 10 characters or less",
            ));
        }
    }

    // Validate location if provided
    if let Some(ref location) = request.location {
        if location.len() > 255 {
            return Err(ActivityError::validation(
                "location",
                "Location must be 255 characters or less",
            ));
        }
    }

    // Validate mood rating if provided
    if let Some(rating) = request.mood_rating {
        if !(1..=5).contains(&rating) {
            return Err(ActivityError::validation(
                "mood_rating",
                "Mood rating must be between 1 and 5",
            ));
        }
    }

    // Validate activity_data JSON size if provided
    if let Some(ref data) = request.activity_data {
        let data_string = data.to_string();
        if data_string.len() > 10000 {
            return Err(ActivityError::validation(
                "activity_data",
                "Activity data must be less than 10KB",
            ));
        }
    }

    Ok(())
}

/// Validate activity update request
pub fn validate_activity_update_request(
    request: &ActivityUpdateRequest,
) -> Result<(), ActivityError> {
    // Validate title if provided
    if let Some(ref title) = request.title {
        if title.trim().is_empty() {
            return Err(ActivityError::validation("title", "Title cannot be empty"));
        }

        if title.len() > 255 {
            return Err(ActivityError::validation(
                "title",
                "Title must be 255 characters or less",
            ));
        }
    }

    // Validate subcategory if provided
    if let Some(ref subcategory) = request.subcategory {
        if subcategory.trim().is_empty() {
            return Err(ActivityError::validation(
                "subcategory",
                "Subcategory cannot be empty",
            ));
        }

        if subcategory.len() > 100 {
            return Err(ActivityError::validation(
                "subcategory",
                "Subcategory must be 100 characters or less",
            ));
        }
    }

    // Validate description if provided
    if let Some(ref description) = request.description {
        if description.len() > 2000 {
            return Err(ActivityError::validation(
                "description",
                "Description must be 2000 characters or less",
            ));
        }
    }

    // Validate activity date if provided
    if let Some(activity_date) = request.activity_date {
        let now = Utc::now();
        let one_year_future = now + chrono::Duration::days(365);

        if activity_date > one_year_future {
            return Err(ActivityError::date_out_of_range(
                "Activity date cannot be more than 1 year in the future",
            ));
        }

        let ten_years_past = now - chrono::Duration::days(3650);

        if activity_date < ten_years_past {
            return Err(ActivityError::date_out_of_range(
                "Activity date cannot be more than 10 years in the past",
            ));
        }
    }

    // Validate cost if provided
    if let Some(cost) = request.cost {
        if cost < 0.0 {
            return Err(ActivityError::validation("cost", "Cost cannot be negative"));
        }

        if cost > 999999.99 {
            return Err(ActivityError::validation(
                "cost",
                "Cost cannot exceed 999,999.99",
            ));
        }
    }

    // Validate currency if provided
    if let Some(ref currency) = request.currency {
        if currency.trim().is_empty() {
            return Err(ActivityError::validation(
                "currency",
                "Currency cannot be empty if specified",
            ));
        }

        if currency.len() > 10 {
            return Err(ActivityError::validation(
                "currency",
                "Currency code must be 10 characters or less",
            ));
        }
    }

    // Validate location if provided
    if let Some(ref location) = request.location {
        if location.len() > 255 {
            return Err(ActivityError::validation(
                "location",
                "Location must be 255 characters or less",
            ));
        }
    }

    // Validate mood rating if provided
    if let Some(rating) = request.mood_rating {
        if !(1..=5).contains(&rating) {
            return Err(ActivityError::validation(
                "mood_rating",
                "Mood rating must be between 1 and 5",
            ));
        }
    }

    // Validate activity_data JSON size if provided
    if let Some(ref data) = request.activity_data {
        let data_string = data.to_string();
        if data_string.len() > 10000 {
            return Err(ActivityError::validation(
                "activity_data",
                "Activity data must be less than 10KB",
            ));
        }
    }

    Ok(())
}

/// Validate activity category string
pub fn validate_activity_category(category_str: &str) -> Result<ActivityCategory, ActivityError> {
    category_str
        .parse()
        .map_err(|_| ActivityError::invalid_type(category_str))
}

/// Validate activity subcategory for a given category
pub fn validate_subcategory_for_category(
    category: ActivityCategory,
    subcategory: &str,
) -> Result<(), ActivityError> {
    let valid_subcategories = match category {
        ActivityCategory::Health => vec![
            "vet-visit",
            "checkup",
            "vaccination",
            "medication",
            "symptoms",
            "treatment",
            "injury",
            "emergency",
        ],
        ActivityCategory::Growth => vec![
            "weight",
            "height",
            "milestone",
            "behavior",
            "training",
            "development",
        ],
        ActivityCategory::Diet => vec![
            "breakfast",
            "lunch",
            "dinner",
            "snack",
            "treat",
            "supplement",
            "water",
            "special-diet",
        ],
        ActivityCategory::Lifestyle => vec![
            "walk", "play", "exercise", "grooming", "bath", "sleep", "travel", "social",
        ],
        ActivityCategory::Expense => vec![
            "food",
            "medical",
            "supplies",
            "grooming",
            "boarding",
            "insurance",
            "other",
        ],
    };

    if !valid_subcategories.contains(&subcategory) {
        return Err(ActivityError::validation(
            "subcategory",
            &format!("Invalid subcategory '{subcategory}' for category '{category}'"),
        ));
    }

    Ok(())
}

/// Validate that required fields are present for specific activity types
pub fn validate_category_specific_requirements(
    category: ActivityCategory,
    subcategory: &str,
    request: &ActivityCreateRequest,
) -> Result<(), ActivityError> {
    match category {
        ActivityCategory::Growth => {
            if subcategory == "weight" || subcategory == "height" {
                // For weight/height tracking, activity_data should contain measurement info
                if request.activity_data.is_none() {
                    return Err(ActivityError::validation(
                        "activity_data",
                        "Measurement data is required for growth tracking activities",
                    ));
                }
            }
        }
        ActivityCategory::Diet => {
            if subcategory != "water" {
                // Most diet activities should have some activity_data for portion info
                if request.activity_data.is_none() {
                    return Err(ActivityError::validation(
                        "activity_data",
                        "Portion or meal data is recommended for diet activities",
                    ));
                }
            }
        }
        ActivityCategory::Expense => {
            // Expense activities should have cost information
            if request.cost.is_none() {
                return Err(ActivityError::validation(
                    "cost",
                    "Cost information is required for expense activities",
                ));
            }
            if request.currency.is_none() {
                return Err(ActivityError::validation(
                    "currency",
                    "Currency is required for expense activities",
                ));
            }
        }
        _ => {
            // Other categories don't have specific requirements
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use serde_json::json;

    fn create_valid_activity_request() -> ActivityCreateRequest {
        ActivityCreateRequest {
            pet_id: 1,
            category: ActivityCategory::Health,
            subcategory: "checkup".to_string(),
            title: "Annual Checkup".to_string(),
            description: Some("Regular health checkup".to_string()),
            activity_date: Utc::now(),
            activity_data: Some(json!({"weight": "12.5kg", "temperature": "normal"})),
            cost: Some(50.0),
            currency: Some("USD".to_string()),
            location: Some("Vet Clinic".to_string()),
            mood_rating: Some(3),
        }
    }

    #[test]
    fn test_valid_activity_create_request() {
        let request = create_valid_activity_request();
        assert!(validate_activity_create_request(&request).is_ok());
    }

    #[test]
    fn test_invalid_pet_id() {
        let mut request = create_valid_activity_request();
        request.pet_id = -1;
        assert!(validate_activity_create_request(&request).is_err());
    }

    #[test]
    fn test_empty_title() {
        let mut request = create_valid_activity_request();
        request.title = "".to_string();
        assert!(validate_activity_create_request(&request).is_err());
    }

    #[test]
    fn test_title_too_long() {
        let mut request = create_valid_activity_request();
        request.title = "a".repeat(256);
        assert!(validate_activity_create_request(&request).is_err());
    }

    #[test]
    fn test_negative_cost() {
        let mut request = create_valid_activity_request();
        request.cost = Some(-10.0);
        assert!(validate_activity_create_request(&request).is_err());
    }

    #[test]
    fn test_invalid_mood_rating() {
        let mut request = create_valid_activity_request();
        request.mood_rating = Some(6);
        assert!(validate_activity_create_request(&request).is_err());
    }

    #[test]
    fn test_future_date_validation() {
        let mut request = create_valid_activity_request();
        request.activity_date = Utc::now() + chrono::Duration::days(400);
        assert!(validate_activity_create_request(&request).is_err());
    }

    #[test]
    fn test_expense_category_validation() {
        let mut request = create_valid_activity_request();
        request.category = ActivityCategory::Expense;
        request.subcategory = "food".to_string();
        request.cost = None;
        assert!(validate_category_specific_requirements(
            request.category,
            &request.subcategory,
            &request
        )
        .is_err());
    }
}
