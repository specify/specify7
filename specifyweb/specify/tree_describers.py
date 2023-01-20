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

    def print_node(self, depth):
        print(self.get_interval_str())
        for child in self.children:
            print('-----' * depth, end='')
            child.print_node(depth + 1)


class Tree:
    def __init__(self, root):
        self.root = root
        self.elements = []

    def add_element(self, element):
        self.elements.append(element)

    def get_possible_squeeze_size(self, node):
        return (
                           node.highest_child_node_number - node.node_number) - self.get_children(
            node)

    def get_children(self, node, count_only=True):
        children = []
        for element in self.elements:
            if node.node_number < element.node_number <= node.highest_child_node_number:
                children.append(element)
        return len(children) if count_only else children

    def shift_subtree_by_steps(self, root_node, steps):
        children = self.get_children(root_node, False)
        for child in children:
            child.node_number += steps
            child.highest_child_node_number += steps


# Constructing test tree
test_node = Node(1, 1, 9)
test_tree = Tree(test_node)
child_node_1 = Node(2, 4, 8)
child_node_1.children.append(Node(3, 6, 8))
test_node.children.append(child_node_1)
test_tree.add_element(test_node)
test_tree.add_element(child_node_1)
test_tree.add_element(Node(3, 6, 8))

def squeeze_interval_by_size(tree, interval_to_squeeze, squeeze_size):
    possible_squeeze_size = interval_to_squeeze.get_possible_squeeze_size(tree)
    ordered_children = interval_to_squeeze.get_ordered_children()
    if squeeze_size > possible_squeeze_size:
        return 0
    if len(ordered_children) == 0:
        if interval_to_squeeze.node_number + squeeze_size <= interval_to_squeeze.highest_child_node_number:
            interval_to_squeeze.node_number += squeeze_size
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

test_node.print_node(1)
squeeze_interval_by_size(test_tree, test_node, 5)
test_node.print_node(1)
