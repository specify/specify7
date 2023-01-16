import logging

logger = logging.getLogger(__name__)
from time import perf_counter
from django.db import connection

sql_str = "select distinct concat_ws( ',', if (t17.rankid < {0}, null, lpad(t17.taxonid, 6, 0)), if ( t16.rankid < {0}, null, lpad(t16.taxonid, 6, 0) ), if ( t15.rankid < {0}, null, lpad(t15.taxonid, 6, 0) ), if ( t14.rankid < {0}, null, lpad(t14.taxonid, 6, 0) ), if ( t13.rankid < {0}, null, lpad(t13.taxonid, 6, 0) ), if ( t12.rankid < {0}, null, lpad(t12.taxonid, 6, 0) ), if ( t11.rankid < {0}, null, lpad(t11.taxonid, 6, 0) ), if ( t10.rankid < {0}, null, lpad(t10.taxonid, 6, 0) ), if (t9.rankid < {0}, null, lpad(t9.taxonid, 6, 0)), if (t8.rankid < {0}, null, lpad(t8.taxonid, 6, 0)), if (t7.rankid < {0}, null, lpad(t7.taxonid, 6, 0)), if (t6.rankid < {0}, null, lpad(t6.taxonid, 6, 0)), if (t5.rankid < {0}, null, lpad(t5.taxonid, 6, 0)), if (t4.rankid < {0}, null, lpad(t4.taxonid, 6, 0)), if (t3.rankid < {0}, null, lpad(t3.taxonid, 6, 0)), if (t2.rankid < {0}, null, lpad(t2.taxonid, 6, 0)), if (t1.rankid < {0}, null, lpad(t1.taxonid, 6, 0)), if (t0.rankid < {0}, null, lpad(t0.taxonid, 6, 0)) ) as path from determination left join taxon t0 on determination.taxonid = t0.taxonid left join taxon t1 on t0.parentid = t1.taxonid left join taxon t2 on t1.parentid = t2.taxonid left join taxon t3 on t2.parentid = t3.taxonid left join taxon t4 on t3.parentid = t4.taxonid left join taxon t5 on t4.parentid = t5.taxonid left join taxon t6 on t5.parentid = t6.taxonid left join taxon t7 on t6.parentid = t7.taxonid left join taxon t8 on t7.parentid = t8.taxonid left join taxon t9 on t8.parentid = t9.taxonid left join taxon t10 on t9.parentid = t10.taxonid left join taxon t11 on t10.parentid = t11.taxonid left join taxon t12 on t11.parentid = t12.taxonid left join taxon t13 on t12.parentid = t13.taxonid left join taxon t14 on t13.parentid = t14.taxonid left join taxon t15 on t14.parentid = t15.taxonid left join taxon t16 on t15.parentid = t16.taxonid left join taxon t17 on t16.parentid = t17.taxonid WHERE CollectionMemberID = {1} AND determination.IsCurrent = true and t0.IsAccepted <> 0 and t0.RankID >= {0} order by path "


def first_bigger_value_iter(number_list, threshold, start_index, finish_index, key=-1, strict=False):
    start_index = start_index
    finish_index = finish_index
    return_value = -1
    return_index = -1
    while start_index <= finish_index:
        mid_index = (start_index + finish_index) // 2
        mid_value = number_list[mid_index]
        if key == -1:
            mid_value_reduced = mid_value
        else:
            mid_value_reduced = mid_value[key]
        if mid_value_reduced <= threshold if strict else mid_value_reduced < threshold:
            start_index = mid_index + 1
        else:
            return_value = mid_value
            return_index = mid_index
            finish_index = mid_index - 1
    return return_index, return_value

def last_smaller_value_iter(number_list, threshold, start_index, finish_index, key=-1):
    start_index = start_index
    finish_index = finish_index
    return_value = -1
    return_index = -1
    while start_index <= finish_index:
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
    return return_index, return_value

#Double Decked Binary Search Tree Counter
#Uses a double-decked binary search algorithm to compute count of ordered intervals with values
def double_decked_binary_counter(interval_list, node_number_list):
    il_start_index = 0
    il_end_index = len(interval_list) - 1
    nn_start_index = 0
    nn_end_index = len(node_number_list) - 1
    occurence_count = 0
    while il_start_index <= il_end_index and nn_start_index <= nn_end_index:
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


def ddie(interval_list, node_number_list, limit):
    il_start_index = 0
    il_end_index = len(interval_list) - 1
    nn_start_index = 0
    nn_end_index = len(node_number_list) - 1

    index_ranges = []
    occurence_count = 0
    while (il_start_index <= il_end_index and nn_start_index <= nn_end_index and occurence_count <= limit):
        node_number_detr = node_number_list[nn_start_index]
        # print(nn_start_index)
        il_sup_index, il_sup_value = last_smaller_value_iter(interval_list, node_number_detr, il_start_index, il_end_index, key=0)
        for t in range(il_sup_index - il_start_index):
            index_ranges.append(-1)
        if il_sup_index == -1:
            nn_start_index += 1
            continue

        start_index_source = nn_start_index
        il_sup_hcnn = il_sup_value[1]

        if (il_sup_hcnn == node_number_detr):
            end_index_source = nn_start_index
            nn_start_index += 1
            index_ranges.append([start_index_source, end_index_source])
            occurence_count += 1
            continue

        end_index_source, end_source_value = last_smaller_value_iter(
            node_number_list, il_sup_hcnn, nn_start_index, nn_end_index)
        index_ranges.append([nn_start_index, end_index_source])
        occurence_count += 1

        nn_next_index, nn_next_value = first_bigger_value_iter(node_number_list, il_sup_hcnn, nn_start_index + 1, nn_end_index,strict=True)

        if nn_next_index == -1:
            break

        nn_start_index = nn_next_index
        il_start_index = il_sup_index + 1

    for t in range(il_end_index - il_start_index - 1):
        index_ranges.append(-1)
    return index_ranges


def ddie1(interval_list, node_number_list):
    il_start_index = 0
    il_end_index = len(interval_list) - 1
    nn_start_index = 0
    nn_end_index = len(node_number_list) - 1

    index_ranges = []

    while il_start_index <= il_end_index and nn_start_index <= nn_end_index:
        node_number_detr = node_number_list[nn_start_index]
        il_sup_index, il_sup_value = last_smaller_value_iter(interval_list,
                                                             node_number_detr,
                                                             il_start_index,
                                                             il_end_index,
                                                             key=0)
        for t in range(il_sup_index - il_start_index):
            index_ranges.append(-1)
        if il_sup_index == -1:
            nn_start_index += 1
            continue
        if il_sup_value[1] >= node_number_detr:
            end_index_source, end_source_value = last_smaller_value_iter(
                node_number_list, il_sup_value[1], nn_start_index, nn_end_index)
            index_ranges.append([nn_start_index, end_index_source])
            # found here (adding - both indexes)
        else:
            nn_start_index += 1
            il_start_index += 1
            # guaranteed to didn't find here (add -1)
            index_ranges.append(-1)
            continue
        il_sup_hcnn = il_sup_value[1]
        if il_sup_hcnn == node_number_detr:
            index_ranges.append(nn_start_index)
            nn_start_index += 1
            # indexes are same (add either index)
            continue
        nn_next_index, nn_next_value = first_bigger_value_iter(node_number_list,
                                                               il_sup_hcnn,
                                                               nn_start_index + 1,
                                                               nn_end_index,
                                                               strict=True)
        if nn_next_index == -1:
            break
        nn_start_index = nn_next_index
        il_start_index = il_sup_index + 1
    return index_ranges

def get_tree_rank_stats_str(rankid, request):
    cursor = connection.cursor()
    cursor.execute(sql_str.format(rankid, request.specify_collection.id))
    all_node_numbers_used = [x[0] for x in list(cursor.fetchall())]

    cursor.execute("""
        select lpad(taxonid, 6, 0) from taxon where rankid = % s
        """, [rankid])
    source_intervals = [str(x[0]) for x in list(cursor.fetchall())]
    source_intervals.sort()

    t1 = perf_counter()
    rank_count = double_decked_binary_counter_str(source_intervals,
                                                  all_node_numbers_used)
    t2 = perf_counter()

    logger.warning('str count took: ')
    logger.warning(t2 - t1)
    logger.warning(rank_count)
    return rank_count

def get_tree_rank_stats(rankid, request):
    cursor = connection.cursor()
    cursor.execute("""
    SELECT distinct(taxon.nodenumber)
        FROM determination join taxon using (taxonid)
        WHERE CollectionMemberID = % s
        AND determination.IsCurrent = true and taxon.IsAccepted <> 0 and taxon.rankid >= % s
    """, [request.specify_collection.id, rankid])
    all_node_numbers_used = [(x[0]) for x in list(cursor.fetchall())]
    all_node_numbers_used.sort()

    cursor.execute("""
    select nodenumber, highestchildnodenumber from taxon where rankid = % s
    """, [rankid])
    source_intervals = list(cursor.fetchall())
    source_intervals.sort()
    t1 = perf_counter()
    rank_count = double_decked_binary_counter(source_intervals, all_node_numbers_used)
    t2 = perf_counter()
    logger.warning('getting count took: ')
    logger.warning(t2-t1)
    logger.warning(rank_count)
    t1 = perf_counter()
    #indexes_used = ddie(source_intervals, all_node_numbers_used, 40)
    indexes_mapped = []
    #for x in indexes_used:
     #   if x != -1:
      #      start_index = x[0]
       #     end_index = x[1]
        #    for index in range(start_index, end_index + 1):
         #       indexes_mapped.append(str(all_node_numbers_used[index]))


    #logger.warning('getting count took: ')
    #logger.warning(t2-t1)
    #logger.warning(rank_count)
    #t1 = perf_counter()
    #indexes_used = ddie(source_intervals, all_node_numbers_used, 40)
    #t2 = perf_counter()
    #logger.warning('get indexes took: ')
    #logger.warning(t2-t1)
    #indexes_mapped = []
    #for x in indexes_used:
    #    if x != -1:
     #       start_index = x[0]
      #      end_index = x[1]
     #       for index in range(start_index, end_index + 1):
      #          indexes_mapped.append(str(all_node_numbers_used[index]))


    #logger.warning('count from mapped: ')
    #index_count_mapped = [1 if x != -1 else 0 for x in indexes_used]
    #logger.warning(sum(index_count_mapped))
    #in_generator = ', '.join(indexes_mapped)
    #logger.warning(','.join(['%s' for x in [1, 2, 4]]))
    #len_match = len(indexes_mapped)
    #match_str = ','.join(['%s' for x in indexes_mapped])
    #x = "select determinationid from determination join taxon using (taxonid) where nodenumber in (" + match_str + ") limit 40"
    #logger.warning('getting data took: ')
    #t1 = perf_counter()
    #cursor.execute(
    #x, indexes_mapped)
    #data = list(cursor.fetchall())
    #t2 = perf_counter()
    #logger.warning(t2-t1)
    #logger.warning(data[1:100])
    return rank_count


def node_number_rework_test(request):
    cursor = connection.cursor()

    collection_member_id = ''
    full_name_test = ''
    rankid_test = ''

    cursor.execute("""
    SELECT distinct(taxon.nodenumber)
    FROM determination join taxon using (taxonid)
    where CollectionMemberID = % s
    and taxon.rankid >= % s
    """, [collection_member_id, full_name_test, rankid_test])
    source_intervals = list(cursor.fetchall())
    source_intervals.sort()

    cursor.execute("""
    SELECT 
        nodeNumber, highestChildNodeNumber, fullName 
    FROM taxon
    where 
        rankid = % s
        and fullName = % s
    """, [rankid_test, full_name_test])
    mapped_intervals = list(cursor.fetchall())
    mapped_intervals.sort()


def double_decked_binary_counter_str(interval_list, node_number_list):
    il_start_index = 0
    il_end_index = len(interval_list) - 1
    nn_start_index = 0
    nn_end_index = len(node_number_list) - 1
    occurence_count = 0
    while il_start_index <= il_end_index and nn_start_index <= nn_end_index:
        node_number_detr = node_number_list[nn_start_index]
        il_sup_index, il_sup_value = last_smaller_value_iter(interval_list, node_number_detr, il_start_index, il_end_index)
        il_sup_hcnn = interval_list[il_sup_index + 1] if il_sup_index < len(interval_list) - 1 else str(int(interval_list[il_sup_index]) + 1)
        if il_sup_index == -1:
            nn_start_index += 1
            continue
        if il_sup_hcnn >= node_number_detr:
            occurence_count += 1

        else:
            nn_start_index += 1
            il_start_index += 1
            # guaranteed to didn't find here (add -1)
            continue
        if il_sup_hcnn == node_number_detr:
            nn_start_index += 1
            #indexes are same (add either index)
            continue
        nn_next_index, nn_next_value = first_bigger_value_iter(node_number_list, il_sup_hcnn, nn_start_index + 1, nn_end_index, strict=True)
        if nn_next_index == -1:
            break
        nn_start_index = nn_next_index
        il_start_index = il_sup_index + 1
    return occurence_count