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
                inter_child_gap += child.node_number - previous_hcnn - 1
            previous_hcnn = child.highest_child_node_number
            interstitial_gap += initial_gap + final_gap + intra_child_gap + inter_child_gap
        return interstitial_gap



class Tree:
    def __init__(self, root):
        self.root = root
        self.elements = []

    def add_element(self, element):
        self.elements.append(element)

    def get_possible_squeeze_size(self, node):
        possible_squeeze_size = 0
        node_number_basis = node.node_number
        direct_children = node.children
        if len(direct_children) == 0:
            return node.highest_child_node_number - node_number_basis
        for direct_child in direct_children:
            possible_child_squeeze_size = self.get_possible_squeeze_size(direct_child)
            possible_squeeze_size += possible_child_squeeze_size + direct_child.node_number - node_number_basis - 1
            node_number_basis = direct_child.highest_child_node_number
        return possible_squeeze_size

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



# Constructing test tree
test_node = Node(1, 1, 9)
test_tree = Tree(test_node)
child_node_1 = Node(2, 4, 5)
child_node_2 = Node(3, 8, 9)
child_node_1_child_1 = Node(4, 3, 3)
#child_node_children_1 = Node(3, 4, 4)
#child_node_children_2 = Node(3, 5, 5)
#child_node_1.children.append(child_node_children_1)
#child_node_1.children.append(child_node_children_2)
test_node.children.append(child_node_1)
test_node.children.append(child_node_2)
#child_node_1.children.append(child_node_1_child_1)
test_tree.add_element(test_node)
test_tree.add_element(child_node_1)
test_tree.add_element(child_node_2)
#test_tree.add_element(child_node_2)
#test_tree.add_element(child_node_1_child_1)
#test_tree.add_element(child_node_children_1)
#test_tree.add_element(child_node_children_2)

#Additional Ideas
#1. Rank children by the number of free nodes and pick one with the least updates - don't always be greedy and look at the future state
#2. If no gap in the front, look at gaps which are at the back
# (will allow tree to always accommodate current highest_child_node_number * step) and never run out until max int size reaches!

def squeeze_interval_by_gaps(tree, interval_to_squeeze: Node, squeeze_size):
    max_initial_gap = interval_to_squeeze.get_initial_gap()
    max_final_gap = interval_to_squeeze.get_final_gap()
    max_interstitial_gap = interval_to_squeeze.get_interstitial_gap()
    max_gap = max_initial_gap + max_final_gap + max_interstitial_gap

    # shift the entire tree if the tree can't be squeezed - base condition during recursion (filter such trees during actual call)
    if squeeze_size > max_gap:
        tree.shift_subtree_by_steps(interval_to_squeeze, squeeze_size)
        return 0

    # min sets gap to 0 if previous gap is sufficient
    initial_gap = min(max_initial_gap, squeeze_size)
    interstitial_gap = min(max_interstitial_gap, squeeze_size - initial_gap)
    final_gap = min(max_final_gap, squeeze_size - (interstitial_gap + initial_gap))
    direct_children = interval_to_squeeze.get_ordered_children()
    remaining_interstitial_gap = interstitial_gap
    previous_child = None
    for child in direct_children:
        tree.shift_subtree_by_steps(child, final_gap)
        possible_child_squeeze = tree.get_possible_squeeze_size(child)
        if previous_child is None:
            squeeze_child_by = min(possible_child_squeeze, remaining_interstitial_gap)
        else:
            interstitial_squeezed_by = min(child.node_number - previous_child.highest_child_node_number - 1, remaining_interstitial_gap)
            squeeze_child_by = min(possible_child_squeeze, (remaining_interstitial_gap - interstitial_squeezed_by))
            tree.shift_subtree_by_steps(previous_child, interstitial_squeezed_by + squeeze_child_by)
        remaining_interstitial_gap = remaining_interstitial_gap - squeeze_child_by
        squeeze_interval_by_gaps(tree, child, squeeze_child_by)
        previous_child = child
    interval_to_squeeze.node_number += squeeze_size

print('Before Squeeze')
test_node.print_subtree()
squeeze_interval_by_gaps(test_tree, test_node, 6)
print('After Squeeze')
test_node.print_subtree()
