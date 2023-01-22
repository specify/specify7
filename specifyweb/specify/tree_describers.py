#File Description and Notes:
#1. tree_describers contain files which simulate a working tree in Specify7. The file was added to make testing for complicated tree functions (like squeezing intervals) easier.
#2. The file is solely for testing the logic of tree functions and no classes and functions should be exported out of this file, other than for testing purposes (see #5).
#3. The file provides Tree and Node class which are minimally equivalent to Django objects, and provide a way to implement and test tree logic without directly accessing the database.
#4. The logic implemented should be converted with appropriate Django wrappers during the actual usage.
#5. Ideally, the functions declared in this file shouldn't be used tor tests, instead use the Django functions implemented

class Node:
    def __init__(self, id, node_number, highest_child_node_number):
        self.id = id
        self.children = []
        self.node_number = node_number
        self.highest_child_node_number = highest_child_node_number

    def get_ordered_children(self):
        # Assume children are already ordered
        return self.children

    def get_interval_str(self):
        return f"[{self.node_number}, {self.highest_child_node_number}]"

    def shift_interval(self, size):
        self.node_number += size
        self.highest_child_node_number += size

    def print_node_by_indent(self, indent):
        print(self.get_interval_str())
        for child in self.children:
            print('-----' * indent, end='')
            child.print_node_by_indent(indent + 1)

    def print_subtree(self):
        self.print_node_by_indent(1)

    def get_initial_gap(self):
        direct_children = self.get_ordered_children()
        if len(direct_children) == 0:
            return 0
        first_child = direct_children[0]
        return first_child.node_number - self.node_number - 1

    def get_final_gap(self):
        direct_children = self.get_ordered_children()
        if len(direct_children) == 0:
            return 0
        last_child = direct_children[-1]
        # Not subtracting 1 since hcnn don't have to be strictly lesser
        return self.highest_child_node_number - last_child.highest_child_node_number

    def get_interstitial_gap(self):
        direct_children = self.get_ordered_children()
        interstitial_gap = 0
        previous_hcnn = None
        inter_child_gap = 0
        if len(direct_children) == 0:
            return self.highest_child_node_number - self.node_number
        for child in direct_children:
            initial_gap = child.get_initial_gap()
            final_gap = child.get_final_gap()
            intra_child_gap = child.get_interstitial_gap()
            if previous_hcnn is not None:
                inter_child_gap = child.node_number - previous_hcnn - 1
            previous_hcnn = child.highest_child_node_number
            interstitial_gap += initial_gap + final_gap + intra_child_gap + inter_child_gap
        return interstitial_gap

    def get_total_gap(self):
        return self.get_initial_gap() + self.get_final_gap() + self.get_interstitial_gap()

class Tree:
    def __init__(self, root):
        self.root = root
        self.elements = []

    def add_element(self, element):
        self.elements.append(element)

    def get_children(self, node, count_only=True):
        children = []
        for element in self.elements:
            if node.node_number < element.node_number <= node.highest_child_node_number:
                children.append(element)
        return len(children) if count_only else children

    def shift_subtree_by_steps(self, root_node, steps):
        children = self.get_children(root_node, False)
        root_node.shift_interval(steps)
        for child in children:
            child.shift_interval(steps)

    def get_gap_by_nn(self, node: Node):
        child_count = 0
        for tree_element in self.elements:
            if node.node_number < tree_element.node_number <= node.highest_child_node_number:
                child_count += 1
        gap = node.highest_child_node_number - node.node_number - child_count
        return gap

# Constructing test tree

test_node = Node(1, 1, 15)
child_node_1 = Node(2, 3, 6)
child_node_2 = Node(3, 9, 10)
child_node_3 = Node(4, 13, 13)
child_node_1_child_1 = Node(5, 4, 4)

test_node.children.append(child_node_1)
test_node.children.append(child_node_2)
#test_node.children.append(child_node_3)
child_node_1.children.append(child_node_1_child_1)

test_tree = Tree(test_node)
test_tree.add_element(test_node)
test_tree.add_element(child_node_1)
test_tree.add_element(child_node_2)
#test_tree.add_element(child_node_3)
test_tree.add_element(child_node_1_child_1)

#Additional Ideas
#1. Rank children by the number of free nodes and pick one with the least updates - don't always be greedy and look at the future state
#2. If no gap in the front, look at gaps which are at the back (will allow tree to always accommodate current highest_child_node_number * step nodes) and never run out until max int size reaches!

def squeeze_interval(tree, interval_to_squeeze: Node, squeeze_size, forward=True):
    max_initial_gap = interval_to_squeeze.get_initial_gap() if forward else interval_to_squeeze.get_final_gap()
    max_final_gap = interval_to_squeeze.get_final_gap() if forward else interval_to_squeeze.get_initial_gap()
    max_interstitial_gap = interval_to_squeeze.get_interstitial_gap()
    max_gap = max_initial_gap + max_final_gap + max_interstitial_gap
    forward_unary = 1 if forward else -1
    # shift the entire tree if the tree can't be squeezed - base condition during recursion (filter such trees during actual call)
    if squeeze_size > max_gap or squeeze_size == 0:
        tree.shift_subtree_by_steps(interval_to_squeeze, forward_unary*squeeze_size)
        return
    # min sets gap to 0 if previous gap is sufficient
    initial_gap = min(max_initial_gap, squeeze_size)
    interstitial_gap = min(max_interstitial_gap, squeeze_size - initial_gap)
    final_gap = min(max_final_gap, squeeze_size - (interstitial_gap + initial_gap))
    direct_children = interval_to_squeeze.get_ordered_children() if forward else interval_to_squeeze.get_ordered_children()[::-1]
    remaining_interstitial_gap = interstitial_gap
    previous_child = None
    interstitial_squeezed_by = 0
    for index, child in enumerate(direct_children):
        tree.shift_subtree_by_steps(child, forward_unary * final_gap)
        possible_child_squeeze = tree.get_gap_by_nn(child)
        if previous_child is None:
            squeeze_child_by = min(possible_child_squeeze, remaining_interstitial_gap)
        else:
            interstitial_squeezed_by = min((child.node_number - previous_child.highest_child_node_number) if forward else abs(child.highest_child_node_number - previous_child.node_number) - 1, remaining_interstitial_gap)
            squeeze_child_by = min(possible_child_squeeze, (remaining_interstitial_gap - interstitial_squeezed_by))
            for previous_children in direct_children[:index]:
                tree.shift_subtree_by_steps(previous_children, (interstitial_squeezed_by + squeeze_child_by)*forward_unary)
        remaining_interstitial_gap = remaining_interstitial_gap - (squeeze_child_by + interstitial_squeezed_by)
        squeeze_interval(tree, child, squeeze_child_by, forward)
        previous_child = child

    if forward:
        interval_to_squeeze.node_number += squeeze_size
    else:
        interval_to_squeeze.highest_child_node_number -= squeeze_size

print('Before Squeeze')
test_node.print_subtree()
squeeze_interval(test_tree, test_node, 11, forward=False)
print('After Squeeze')
test_node.print_subtree()
