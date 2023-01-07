import logging

logger = logging.getLogger(__name__)



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
        node_number_sup = first_bigger_value(occurred_node_numbers, node_number)
        if node_number_sup == -1:
            continue
        rank_count += 1 if node_number_sup <= highest_child_number else 0
    return rank_count

def count_occurrence_ranks_aggregated(node_number_ranges, occurred_node_numbers):
    rank_count = 0
    for (list1, list2) in node_number_ranges:
        lowest_node_number = min(list1[0], list2[0])
        highest_node_number = max(list1[1], list2[1])
        occurred_node_sup_val = first_bigger_value(occurred_node_numbers,
                                                    lowest_node_number)
        if occurred_node_sup_val == -1:
            continue
        if occurred_node_sup_val <= highest_node_number:
            if occurred_node_sup_val <= min(list1[1], list2[1]):
                rank_count += 1
            elif occurred_node_sup_val >= max(list1[0], list2[0]):
                rank_count += 1
    return rank_count

def count_occurence_optimized(interval_list, node_list):
    occurence_count = 0
    if len(interval_list) == 0:
        return occurence_count
    middle_index = (len(interval_list) - 1) // 2
    middle_node_number = interval_list[middle_index][0]
    middle_highest_child_nn = interval_list[middle_index][1]
    occurence_counts_left = count_occurence_optimized(interval_list[0:middle_index], node_list)
    test_node_value = first_bigger_value(node_list, middle_node_number)
    if test_node_value == -1:
        return 0
    occurence_counts_right = count_occurence_optimized(interval_list[middle_index+1: len(interval_list)], node_list)
    occurence_count = occurence_counts_left + occurence_counts_right + (1 if test_node_value <= middle_highest_child_nn else 0)
    return occurence_count




