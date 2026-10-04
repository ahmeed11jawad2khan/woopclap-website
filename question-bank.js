(() => {
    "use strict";

    window.WOOPCLAP_QUESTION_BANK = [
        {
            id: "ds-array-index-1", subject: "Data Structures", topic: "Arrays", level: "Basic", difficulty: "Easy",
            question: "In a zero-based array of length n, what is the largest valid index?", options: ["n", "n - 1", "n + 1", "1"], answer: "n - 1",
            explanation: "Zero-based indices begin at 0, so an array of length n has indices 0 through n - 1."
        },
        {
            id: "ds-array-access-1", subject: "Data Structures", topic: "Array operations", level: "Basic", difficulty: "Easy",
            question: "What is the usual time complexity of reading an array element by a valid index?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], answer: "O(1)",
            explanation: "An array index identifies an element directly, so indexed access takes constant time."
        },
        {
            id: "ds-complexity-1", subject: "Data Structures", topic: "Time complexity", level: "Basic", difficulty: "Easy",
            question: "A loop visits each of n elements once. What is its time complexity?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], answer: "O(n)",
            explanation: "The number of visits grows linearly with the number of elements."
        },
        {
            id: "ds-linear-search-1", subject: "Data Structures", topic: "Linear search", level: "Basic", difficulty: "Easy",
            question: "What is the worst-case number of comparisons for linear search through n items?", options: ["1", "log₂ n", "n", "n²"], answer: "n",
            explanation: "If the target is last or absent, linear search may examine every item."
        },
        {
            id: "ds-linked-list-1", subject: "Data Structures", topic: "Singly Linked Lists", level: "Intermediate", difficulty: "Medium",
            question: "What does a node in a singly linked list normally store?", options: ["A value and a link to the next node", "A value and links to both neighbors", "Only an array index", "A sorted copy of the whole list"], answer: "A value and a link to the next node",
            explanation: "Each singly linked node stores data and a reference to the next node; the final node points to null."
        },
        {
            id: "ds-linked-list-insert-1", subject: "Data Structures", topic: "Linked List operations", level: "Intermediate", difficulty: "Medium",
            question: "If a pointer to a singly linked-list node is already available, what is the usual time to insert a new node immediately after it?", options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], answer: "O(1)",
            explanation: "Only a constant number of links need to be updated when the insertion position is already known."
        },
        {
            id: "ds-stack-1", subject: "Data Structures", topic: "Stacks", level: "Intermediate", difficulty: "Easy",
            question: "Which rule describes the order in which a stack removes items?", options: ["FIFO", "LIFO", "Sorted order", "Priority order"], answer: "LIFO",
            explanation: "A stack is Last In, First Out: the most recently pushed item is popped first."
        },
        {
            id: "ds-stack-push-pop-1", subject: "Data Structures", topic: "Stack operations", level: "Intermediate", difficulty: "Medium",
            question: "Starting with an empty stack, perform push(4), push(7), pop(). What value is returned?", options: ["4", "7", "11", "The stack is empty"], answer: "7",
            explanation: "Pop removes the top item. The most recently pushed value, 7, is on top."
        },
        {
            id: "ds-queue-1", subject: "Data Structures", topic: "Queues", level: "Intermediate", difficulty: "Easy",
            question: "Which rule describes a standard queue?", options: ["Last in, first out", "First in, first out", "Largest in, first out", "Random removal"], answer: "First in, first out",
            explanation: "A queue removes items in arrival order: First In, First Out (FIFO)."
        },
        {
            id: "ds-circular-queue-1", subject: "Data Structures", topic: "Circular Queues", level: "Intermediate", difficulty: "Medium",
            question: "Why can a circular array queue reuse slots freed at the front?", options: ["Its indices wrap around to the start", "It shifts every item after each removal", "It sorts items by priority", "It doubles its capacity on every dequeue"], answer: "Its indices wrap around to the start",
            explanation: "Modulo-based index updates let the rear continue at the beginning of the array when space is available."
        },
        {
            id: "ds-recursion-1", subject: "Data Structures", topic: "Recursion", level: "Intermediate", difficulty: "Medium",
            question: "What is essential to ensure a recursive function eventually stops?", options: ["A reachable base case", "A global variable", "A loop in every function", "A larger input on every call"], answer: "A reachable base case",
            explanation: "A base case stops further recursive calls; each recursive path must eventually reach it."
        },
        {
            id: "ds-tree-traversal-1", subject: "Data Structures", topic: "Tree traversals", level: "Intermediate", difficulty: "Medium",
            question: "In which binary-tree traversal is the root visited between the left and right subtrees?", options: ["Preorder", "Inorder", "Postorder", "Level-order only"], answer: "Inorder",
            explanation: "Inorder traversal visits left subtree, root, then right subtree."
        },
        {
            id: "ds-bst-1", subject: "Data Structures", topic: "Binary Search Trees", level: "Intermediate", difficulty: "Medium",
            question: "For a binary search tree with distinct keys, where are keys smaller than a node's key placed?", options: ["In its left subtree", "In its right subtree", "Only in leaf nodes", "In a separate queue"], answer: "In its left subtree",
            explanation: "The BST ordering property places smaller keys in the left subtree and larger keys in the right subtree."
        },
        {
            id: "ds-heap-1", subject: "Data Structures", topic: "Heaps", level: "Advanced", difficulty: "Hard",
            question: "In a max-heap, which value is stored at the root?", options: ["The maximum value", "The minimum value", "The most recently inserted value", "Any value with no ordering rule"], answer: "The maximum value",
            explanation: "Every parent in a max-heap is at least as large as its children, so the maximum is at the root."
        },
        {
            id: "ds-hash-collision-1", subject: "Data Structures", topic: "Collision handling", level: "Advanced", difficulty: "Hard",
            question: "What is a hash collision?", options: ["Two keys map to the same table position", "A key is deleted twice", "A table contains no empty slots", "A key is compared using binary search"], answer: "Two keys map to the same table position",
            explanation: "A collision occurs when distinct keys produce the same hash-table index; a collision-resolution method is needed."
        },
        {
            id: "ds-graph-bfs-1", subject: "Data Structures", topic: "Breadth-First Search", level: "Advanced", difficulty: "Hard",
            question: "Which data structure is typically used to manage the frontier in breadth-first search?", options: ["Queue", "Stack", "Max-heap", "Unsorted linked list with no removal order"], answer: "Queue",
            explanation: "A FIFO queue processes vertices in the order they are discovered, visiting the graph level by level."
        },
        {
            id: "ds-graph-dfs-1", subject: "Data Structures", topic: "Depth-First Search", level: "Advanced", difficulty: "Hard",
            question: "Which structure naturally supports an iterative depth-first search?", options: ["Stack", "FIFO queue", "Circular buffer only", "Hash function"], answer: "Stack",
            explanation: "A stack follows the last-discovered-first-explored behavior used by iterative depth-first search."
        },
        {
            id: "ds-merge-sort-1", subject: "Data Structures", topic: "Merge Sort", level: "Advanced", difficulty: "Hard",
            question: "What is the worst-case time complexity of merge sort on n elements?", options: ["O(n)", "O(log n)", "O(n log n)", "O(n²)"], answer: "O(n log n)",
            explanation: "Merge sort divides the input into logarithmically many levels and performs O(n) merging work per level."
        },
        {
            id: "ds-avl-1", subject: "Data Structures", topic: "AVL Trees", level: "Advanced", difficulty: "Hard",
            question: "What property does an AVL tree maintain at every node?", options: ["The heights of the two child subtrees differ by at most one", "Every node has exactly two children", "All keys are stored in leaves", "The tree is always a complete binary tree"], answer: "The heights of the two child subtrees differ by at most one",
            explanation: "AVL trees maintain a balance factor of -1, 0, or 1 at each node, restoring balance with rotations after updates."
        },
        {
            id: "dld-binary-addition-1", subject: "DLD", topic: "Binary Arithmetic", difficulty: "Easy",
            question: "What is 1 + 1 in binary?", options: ["0", "1", "10", "11"], answer: "10",
            explanation: "Binary uses base 2, so 1 + 1 produces 0 with a carry of 1, written as 10."
        },
        {
            id: "dld-twos-complement-1", subject: "DLD", topic: "Binary Arithmetic", difficulty: "Medium",
            question: "What is the 8-bit two's complement representation of -5?", options: ["00000101", "11111010", "11111011", "10000101"], answer: "11111011",
            explanation: "Invert 00000101 to get 11111010, then add 1 to get 11111011."
        },
        {
            id: "dld-boolean-law-1", subject: "DLD", topic: "Boolean Algebra", difficulty: "Easy",
            question: "Which expression is equivalent to A · 1?", options: ["0", "1", "A", "A'"], answer: "A",
            explanation: "The identity law for AND states that A · 1 = A."
        },
        {
            id: "dld-demorgan-1", subject: "DLD", topic: "Boolean Algebra", difficulty: "Medium",
            question: "According to De Morgan's law, what is the complement of A · B?", options: ["A' · B'", "A' + B'", "A + B", "A · B'"], answer: "A' + B'",
            explanation: "De Morgan's law says the complement of a product is the sum of the complements."
        },
        {
            id: "dld-flipflop-1", subject: "DLD", topic: "Sequential Circuits", difficulty: "Easy",
            question: "Which flip-flop stores one bit and has a data input D?", options: ["D flip-flop", "JK flip-flop", "T flip-flop", "SR latch only"], answer: "D flip-flop",
            explanation: "A D flip-flop stores the value present at D when its active clock edge occurs."
        },
        {
            id: "dld-counter-1", subject: "DLD", topic: "Sequential Circuits", difficulty: "Hard",
            question: "How many flip-flops are needed for a binary counter with 16 distinct states?", options: ["2", "3", "4", "16"], answer: "4",
            explanation: "n flip-flops represent 2^n states; 2^4 = 16."
        },
        {
            id: "dbms-key-1", subject: "DBMS", topic: "Relational Model", difficulty: "Easy",
            question: "What does a primary key do in a relational table?", options: ["Uniquely identifies each row", "Sorts rows automatically", "Encrypts each column", "Allows duplicate records"], answer: "Uniquely identifies each row",
            explanation: "A primary key uniquely identifies each tuple and cannot contain duplicate or null values."
        },
        {
            id: "dbms-foreign-key-1", subject: "DBMS", topic: "Relational Model", difficulty: "Medium",
            question: "A foreign key most directly helps enforce which property?", options: ["Referential integrity", "Data compression", "Column sorting", "Query caching"], answer: "Referential integrity",
            explanation: "A foreign key requires references to match a key in the related table (or be null if allowed)."
        },
        {
            id: "dbms-normalization-1", subject: "DBMS", topic: "Normalization", difficulty: "Easy",
            question: "What is a main goal of database normalization?", options: ["Reduce update anomalies", "Increase duplicate data", "Remove all keys", "Store every value as text"], answer: "Reduce update anomalies",
            explanation: "Normalization organizes data to reduce unnecessary redundancy and insertion, update, and deletion anomalies."
        },
        {
            id: "dbms-2nf-1", subject: "DBMS", topic: "Normalization", difficulty: "Hard",
            question: "A relation is in 2NF when it is in 1NF and every non-key attribute is fully dependent on what?", options: ["The whole candidate key", "Any one attribute", "A foreign key only", "The table name"], answer: "The whole candidate key",
            explanation: "Second normal form removes partial dependencies on part of a composite candidate key."
        },
        {
            id: "dbms-join-1", subject: "DBMS", topic: "SQL Queries", difficulty: "Easy",
            question: "Which SQL join returns only rows with matching values in both tables?", options: ["INNER JOIN", "LEFT JOIN", "CROSS JOIN", "FULL OUTER JOIN"], answer: "INNER JOIN",
            explanation: "An INNER JOIN returns rows when the join condition matches in both tables."
        },
        {
            id: "dbms-groupby-1", subject: "DBMS", topic: "SQL Queries", difficulty: "Medium",
            question: "Which clause filters grouped rows after aggregate calculations?", options: ["WHERE", "HAVING", "ORDER BY", "LIMIT"], answer: "HAVING",
            explanation: "WHERE filters rows before grouping; HAVING filters groups after aggregate calculations."
        },
        {
            id: "programming-variable-1", subject: "Programming", topic: "Core Concepts", difficulty: "Easy",
            question: "What is a variable in a program?", options: ["A named place to store a value", "A type of loop", "A syntax error", "A compiled library"], answer: "A named place to store a value",
            explanation: "A variable is a name associated with a value that a program can use and often update."
        },
        {
            id: "programming-complexity-1", subject: "Programming", topic: "Core Concepts", difficulty: "Medium",
            question: "What is the time complexity of reading an array element by its index?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], answer: "O(1)",
            explanation: "Array indexing calculates the element address directly, so access takes constant time."
        },
        {
            id: "programming-stack-1", subject: "Programming", topic: "Data Structures", difficulty: "Easy",
            question: "Which rule describes how a stack removes items?", options: ["First in, first out", "Last in, first out", "Smallest first", "Random order"], answer: "Last in, first out",
            explanation: "A stack is LIFO: its most recently pushed item is popped first."
        },
        {
            id: "programming-binary-search-1", subject: "Programming", topic: "Algorithms", difficulty: "Medium",
            question: "What precondition does binary search require for its usual array implementation?", options: ["The array is sorted", "The array has unique values", "The array length is even", "The array contains only integers"], answer: "The array is sorted",
            explanation: "Binary search discards half of the remaining range at each step, which requires sorted order."
        },
        {
            id: "programming-recursion-1", subject: "Programming", topic: "Algorithms", difficulty: "Hard",
            question: "What prevents a recursive function from calling itself forever?", options: ["A base case", "A global variable", "A larger input", "A return type"], answer: "A base case",
            explanation: "A base case handles the simplest input and stops further recursive calls."
        },
        {
            id: "math-fraction-1", subject: "Mathematics", topic: "Arithmetic", difficulty: "Easy",
            question: "What is 3/4 expressed as a decimal?", options: ["0.25", "0.5", "0.75", "1.25"], answer: "0.75",
            explanation: "3 divided by 4 equals 0.75."
        },
        {
            id: "math-percentage-1", subject: "Mathematics", topic: "Arithmetic", difficulty: "Medium",
            question: "What is 15% of 200?", options: ["15", "20", "30", "45"], answer: "30",
            explanation: "Convert 15% to 0.15 and calculate 0.15 × 200 = 30."
        },
        {
            id: "math-linear-1", subject: "Mathematics", topic: "Algebra", difficulty: "Easy",
            question: "Solve x + 7 = 12.", options: ["3", "5", "7", "19"], answer: "5",
            explanation: "Subtract 7 from both sides: x = 12 - 7 = 5."
        },
        {
            id: "math-quadratic-1", subject: "Mathematics", topic: "Algebra", difficulty: "Hard",
            question: "What are the roots of x² - 5x + 6 = 0?", options: ["1 and 6", "−2 and −3", "2 and 3", "−1 and −6"], answer: "2 and 3",
            explanation: "Factor the expression as (x - 2)(x - 3) = 0."
        },
        {
            id: "math-mean-1", subject: "Mathematics", topic: "Statistics", difficulty: "Easy",
            question: "What is the mean of 2, 4, and 6?", options: ["3", "4", "5", "12"], answer: "4",
            explanation: "The mean is (2 + 4 + 6) / 3 = 4."
        },
        {
            id: "math-probability-1", subject: "Mathematics", topic: "Statistics", difficulty: "Medium",
            question: "What is the probability of rolling an even number on a fair six-sided die?", options: ["1/6", "1/3", "1/2", "2/3"], answer: "1/2",
            explanation: "Three of the six outcomes (2, 4, 6) are even, so the probability is 3/6 = 1/2."
        },
        {
            id: "dld-binary-addition-2", subject: "DLD", topic: "Binary Arithmetic", difficulty: "Hard",
            question: "What is 1011₂ + 0110₂?", options: ["10001₂", "10010₂", "11001₂", "1111₂"], answer: "10001₂",
            explanation: "1011₂ is 11 and 0110₂ is 6; their sum is 17, or 10001₂."
        },
        {
            id: "dld-boolean-law-2", subject: "DLD", topic: "Boolean Algebra", difficulty: "Hard",
            question: "Using the absorption law, simplify A + A · B.", options: ["A", "B", "A + B", "A · B"], answer: "A",
            explanation: "The absorption identity is A + A · B = A."
        },
        {
            id: "dld-sequential-2", subject: "DLD", topic: "Sequential Circuits", difficulty: "Medium",
            question: "What does a T flip-flop do when T = 1 at its active clock edge?", options: ["Holds its state", "Toggles its state", "Clears asynchronously", "Sets both outputs to 1"], answer: "Toggles its state",
            explanation: "A T flip-flop toggles when T is high and holds its previous state when T is low."
        },
        {
            id: "dbms-relational-2", subject: "DBMS", topic: "Relational Model", difficulty: "Hard",
            question: "In the relational model, what is a tuple?", options: ["A row in a relation", "A column constraint", "A database server", "A query plan"], answer: "A row in a relation",
            explanation: "A tuple is a single row (record) in a relation (table)."
        },
        {
            id: "dbms-normalization-2", subject: "DBMS", topic: "Normalization", difficulty: "Medium",
            question: "Which dependency causes a partial-dependency problem addressed by 2NF?", options: ["A non-key attribute depends on part of a composite key", "A key depends on itself", "A table has a primary key", "A column contains atomic values"], answer: "A non-key attribute depends on part of a composite key",
            explanation: "2NF removes non-key attributes that depend on only part of a composite candidate key."
        },
        {
            id: "dbms-sql-2", subject: "DBMS", topic: "SQL Queries", difficulty: "Hard",
            question: "Which SQL keyword removes duplicate rows from a SELECT result?", options: ["UNIQUE", "DISTINCT", "SINGLE", "FILTER"], answer: "DISTINCT",
            explanation: "SELECT DISTINCT returns only unique rows in the result set."
        },
        {
            id: "programming-core-2", subject: "Programming", topic: "Core Concepts", difficulty: "Hard",
            question: "What does a pure function guarantee for the same input?", options: ["The same output and no side effects", "A different output each time", "It always modifies global state", "It never returns a value"], answer: "The same output and no side effects",
            explanation: "A pure function is deterministic for a given input and has no observable side effects."
        },
        {
            id: "programming-data-2", subject: "Programming", topic: "Data Structures", difficulty: "Medium",
            question: "Which data structure is typically used to process items in first-in, first-out order?", options: ["Stack", "Queue", "Tree", "Heap"], answer: "Queue",
            explanation: "A queue inserts at the rear and removes from the front, giving FIFO order."
        },
        {
            id: "programming-algorithm-2", subject: "Programming", topic: "Algorithms", difficulty: "Easy",
            question: "What is the worst-case time complexity of linear search through n items?", options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], answer: "O(n)",
            explanation: "In the worst case, linear search checks each of the n items once."
        },
        {
            id: "math-arithmetic-2", subject: "Mathematics", topic: "Arithmetic", difficulty: "Hard",
            question: "What is the least common multiple of 12 and 18?", options: ["6", "24", "36", "72"], answer: "36",
            explanation: "The smallest positive number divisible by both 12 and 18 is 36."
        },
        {
            id: "math-algebra-2", subject: "Mathematics", topic: "Algebra", difficulty: "Medium",
            question: "If 3x = 21, what is x?", options: ["6", "7", "18", "24"], answer: "7",
            explanation: "Divide both sides of 3x = 21 by 3 to get x = 7."
        },
        {
            id: "math-statistics-2", subject: "Mathematics", topic: "Statistics", difficulty: "Hard",
            question: "What is the median of 2, 5, 9, and 12?", options: ["5", "7", "7.5", "9"], answer: "7",
            explanation: "With four ordered values, the median is the mean of the middle pair: (5 + 9) / 2 = 7."
        }
    ];
})();
