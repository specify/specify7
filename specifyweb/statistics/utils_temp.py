#Double Decked BST Occurrence Counter
import logging

logger = logging.getLogger(__name__)


def first_bigger_value_iter(number_list, threshold, start_index, finish_index, key=-1, strict=False):
    start_index = start_index
    finish_index = finish_index
    return_value = -1
    return_index = -1
    while (start_index <= finish_index):
        mid_index = (start_index + finish_index) // 2
        mid_value = number_list[mid_index]
        if key == -1:
            mid_value_reduced = mid_value
        else:
            mid_value_reduced = mid_value[key]
        if mid_value_reduced <= threshold if strict else mid_value_reduced <=threshold:
            start_index = mid_index + 1
        else:
            return_value = mid_value
            return_index = mid_index
            finish_index = mid_index - 1
    return (return_index, return_value)

def last_smaller_value_iter(number_list, threshold, start_index, finish_index, key=-1):
    start_index = start_index
    finish_index = finish_index
    return_value = -1
    return_index = -1
    while (start_index <= finish_index):
        mid_index = (start_index + finish_index) // 2
        mid_value = number_list[mid_index]
        if key == -1:
            mid_value_reduced = mid_value
        else:
            mid_value_reduced = mid_value[key]
        if mid_value_reduced <= threshold:
            return_value = mid_value
            return_index = mid_index
            start_index = mid_index + 1
        else:
            finish_index = mid_index - 1
    return (return_index, return_value)

def ddoc(interval_list, node_number_list):
    il_start_index = 0
    il_end_index = len(interval_list) - 1
    nn_start_index = 0
    nn_end_index = len(node_number_list) - 1
    occurence_count = 0
    while (il_start_index <= il_end_index and nn_start_index <= nn_end_index):
        node_number_detr = node_number_list[nn_start_index]
        il_sup_index, il_sup_value = last_smaller_value_iter(interval_list, node_number_detr, il_start_index, il_end_index, key=0)
        if il_sup_index == -1:
            nn_start_index += 1
            continue
        if il_sup_value[1] >= node_number_detr:
            occurence_count += 1
        else:
            nn_start_index += 1
            il_start_index += 1
            continue
        il_sup_hcnn = il_sup_value[1]
        if il_sup_hcnn == node_number_detr:
            nn_start_index += 1
            continue
        nn_next_index, nn_next_value = first_bigger_value_iter(node_number_list, il_sup_hcnn, nn_start_index + 1, nn_end_index, strict=True)
        if nn_next_index == -1:
            break
        nn_start_index = nn_next_index
        il_start_index = il_sup_index + 1
    return occurence_count
