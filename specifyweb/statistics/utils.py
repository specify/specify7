def first_bigger_index(number_list, number_to_check, start_index, final_index):
    if len(number_list[start_index: final_index + 1]) == 0:
        return -1
    middle_index = (start_index + final_index) // 2
    if number_list[middle_index] < number_to_check:
        return first_bigger_index(number_list, number_to_check, middle_index + 1,
                               final_index)
    next_index = first_bigger_index(number_list, number_to_check, start_index,
                                 middle_index - 1)
    if next_index == -1:
        return middle_index
    return min(middle_index, next_index)


def first_bigger_value(number_list, number_to_check):
    if len(number_list) == 0:
        return -1  # Assuming the values in the list are positive
    middle_index = (len(number_list) - 1) // 2
    middle_value = number_list[middle_index]
    if middle_value < number_to_check:
        return first_bigger_value(
            number_list[middle_index + 1:len(number_list)], number_to_check)
    next_value = first_bigger_value(number_list[0:middle_index],
                                    number_to_check)
    if next_value == -1:
        return middle_value
    return min(middle_value, next_value)


def is_any_smaller_or_equal(number_list, number_to_check):
    if len(number_list) == 0:
        return False
    middle_index = (len(number_list) - 1) // 2
    if number_list[middle_index] <= number_to_check:
        return True
    return is_any_smaller_or_equal(number_list[0:middle_index], number_to_check)

def count_occurrence_ranks(node_number_ranges, occurred_node_numbers):
    rank_count = 0
    for (node_number, highest_child_number) in node_number_ranges:
        node_number_sup_index = first_bigger_index(occurred_node_numbers, node_number, 0, len(occurred_node_numbers)-1)
        if node_number_sup_index == -1:
            continue
        rank_count += 1 if is_any_smaller_or_equal(occurred_node_numbers[node_number_sup_index: len(occurred_node_numbers)], highest_child_number) else 0
    return rank_count


