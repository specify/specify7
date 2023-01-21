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
            child.print_node(indent + 1)

    def print_subtree(self):
        self.print_node_by_indent(1)


class Tree:
    def __init__(self, root):
        self.root = root
        self.elements = []

    def add_element(self, element):
        self.elements.append(element)

    def get_possible_squeeze_size(self, node):
        possible_squeeze_size = 0
        node_number_basis = node.node_number
        for direct_child in node.children:
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
child_node_1 = Node(2, 2, 8)
child_node_children_1 = Node(3, 3, 3)
child_node_children_2 = Node(3, 4, 4)
child_node_1.children.append(child_node_children_1)
child_node_1.children.append(child_node_children_2)
test_node.children.append(child_node_1)
test_tree.add_element(test_node)
test_tree.add_element(child_node_1)
test_tree.add_element(child_node_children_1)
test_tree.add_element(child_node_children_2)

#Additional Ideas
#1. Rank children by the number of free nodes and pick one with the least updates - don't always be greedy and look at the future state
#2. If no gap in the front, look at gaps which are at the back
# (will allow tree to always accommodate current highest_child_node_number * step) and never run out until max int size reaches!

def squeeze_interval_by_size(tree, interval_to_squeeze, squeeze_size):
    possible_squeeze_size = tree.get_possible_squeeze_size(interval_to_squeeze)
    ordered_children = interval_to_squeeze.get_ordered_children()
    if squeeze_size > possible_squeeze_size:
        tree.shift_subtree_by_steps(interval_to_squeeze, squeeze_size)
        return 0
    if len(ordered_children) == 0:
        if interval_to_squeeze.node_number + squeeze_size <= interval_to_squeeze.highest_child_node_number:
            interval_to_squeeze.node_number += squeeze_size
            interval_to_squeeze.highest_child_node_number += squeeze_size
            return squeeze_size
        else:
            return 0
    first_child = ordered_children[0]
    gap = first_child.node_number - interval_to_squeeze.node_number
    if gap <= squeeze_size:
        squeeze_children_by = 1 + squeeze_size - gap
        for child in ordered_children:
            child_squeezed_by = squeeze_interval_by_size(tree, child, squeeze_children_by)
            squeeze_children_by = squeeze_children_by - child_squeezed_by
    interval_to_squeeze.node_number += squeeze_size
    return squeeze_size

print('Before Squeeze')
test_node.print_subtree()
squeeze_interval_by_size(test_tree, test_node, 3)
print('After Squeeze')
test_node.print_subtree()
