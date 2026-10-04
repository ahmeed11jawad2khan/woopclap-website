(() => {
    "use strict";

    window.WOOPCLAP_STUDY_MATERIALS = [
        {
            subject: "DLD", topic: "Number Systems", title: "Number Systems & Binary Addition",
            explanation: "Digital circuits represent values with bits. Binary is a base-2 number system; each place represents a power of two. Addition follows familiar carrying rules, but each column can sum to 0, 1, 2, or 3.",
            keyPoints: ["Binary digits are 0 and 1.", "Place values from right to left are 1, 2, 4, 8, and so on.", "In binary addition, 1 + 1 is written 10: write 0 and carry 1."],
            examples: ["101₂ = 5₁₀.", "1011₂ + 0110₂ = 10001₂."],
            definitions: ["Bit: one binary digit.", "Carry: a value passed to the next column when a column sum reaches the base."],
            revision: "Read binary place values from right to left as powers of two. Add one column at a time and carry when the sum is at least two.",
            questionTopic: "Binary Arithmetic"
        },
        {
            subject: "DLD", topic: "Boolean Algebra", title: "Logic Gates & Boolean Algebra",
            explanation: "Boolean algebra describes logic using two values, often written 0 and 1. Logic gates implement operations such as AND, OR, and NOT in digital circuits.",
            keyPoints: ["AND is 1 only when every input is 1.", "OR is 1 when at least one input is 1.", "NOT reverses a bit; De Morgan's laws relate complements of compound expressions."],
            examples: ["A · 1 = A (identity).", "A + A · B = A (absorption)."],
            definitions: ["Boolean variable: a variable with values 0 or 1.", "Truth table: a table listing an expression's output for every input combination."],
            revision: "Memorize truth tables for AND, OR, NOT, then simplify expressions using identity, complement, absorption, and De Morgan's laws.",
            questionTopic: "Boolean Algebra"
        },
        {
            subject: "DLD", topic: "Sequential Circuits", title: "Sequential Circuits",
            explanation: "A sequential circuit's output depends on its current inputs and stored state. Flip-flops provide storage, often updating on a clock edge.",
            keyPoints: ["Combinational circuits have no stored state.", "A D flip-flop captures its D input at its active clock edge.", "A T flip-flop toggles when T is 1."],
            examples: ["Four flip-flops can encode 16 states because 2⁴ = 16."],
            definitions: ["Flip-flop: a clocked circuit that stores one bit.", "State: the stored information describing a circuit at a moment."],
            revision: "Distinguish combinational from sequential logic. Count n flip-flops as 2ⁿ possible binary states.",
            questionTopic: "Sequential Circuits"
        },
        {
            subject: "DLD", topic: "Complements", title: "Complements & Signed Binary",
            explanation: "Two's complement represents signed integers using a fixed number of bits. To negate a positive value, invert every bit and add one.",
            keyPoints: ["For n bits, the signed range is −2ⁿ⁻¹ through 2ⁿ⁻¹ − 1.", "Negation is bitwise inversion followed by adding 1.", "Keep the chosen bit width consistent."],
            examples: ["In 8 bits, +5 is 00000101; −5 is 11111011."],
            definitions: ["Two's complement: a fixed-width signed binary encoding formed by inverting and incrementing."],
            revision: "Write the value at a fixed width, invert all bits, then add one. Check the result remains within the width.",
            questionTopic: "Binary Arithmetic"
        },
        {
            subject: "DLD", topic: "BCD", title: "BCD & Decimal Encoding",
            explanation: "Binary-coded decimal stores each decimal digit in its own four-bit group. It is useful when decimal digits must be represented directly.",
            keyPoints: ["Each decimal digit uses a separate four-bit nibble.", "Valid BCD digit codes range from 0000 to 1001.", "A BCD group from 1010 to 1111 is not a valid decimal digit."],
            examples: ["Decimal 59 is 0101 1001 in BCD."],
            definitions: ["Nibble: a group of four bits.", "BCD: a decimal digit encoding where each digit is represented independently."],
            revision: "Convert each decimal digit separately to four-bit binary; do not convert the entire number as one binary value.",
            questionTopic: "Boolean Algebra"
        },
        {
            subject: "DLD", topic: "Binary Addition", title: "Binary Addition Practice",
            explanation: "Add binary values from the least significant bit toward the left. If a column totals two or three, write the remainder after division by two and carry the quotient.",
            keyPoints: ["0 + 0 = 0.", "0 + 1 = 1.", "1 + 1 = 10 and 1 + 1 + 1 = 11."],
            examples: ["011₂ + 001₂ = 100₂.", "1011₂ + 0110₂ = 10001₂."],
            definitions: ["Least significant bit: the rightmost bit, representing the units place."],
            revision: "Align bits by their right edge. Add each column including its carry, and check by converting the result to decimal.",
            questionTopic: "Binary Arithmetic"
        },
        {
            subject: "DLD", topic: "Logic Gates", title: "Logic Gates",
            explanation: "Logic gates implement Boolean operations on digital inputs. Their truth tables define the output for each input combination.",
            keyPoints: ["AND requires all inputs to be 1.", "OR requires at least one input to be 1.", "NOT complements one input; XOR is 1 when inputs differ."],
            examples: ["For A = 1, B = 0: A AND B = 0; A OR B = 1; A XOR B = 1."],
            definitions: ["XOR: exclusive OR, true when an odd number of inputs are true."],
            revision: "Rebuild the truth table instead of guessing. For two inputs there are four possible rows.",
            questionTopic: "Boolean Algebra"
        },
        {
            subject: "DLD", topic: "Number Systems", title: "Octal & Hexadecimal",
            explanation: "Octal and hexadecimal are compact ways to write binary values. One octal digit represents three bits; one hexadecimal digit represents four bits.",
            keyPoints: ["Octal uses digits 0–7.", "Hexadecimal uses 0–9 and A–F.", "Convert binary by grouping bits from the right into groups of three or four."],
            examples: ["1111₂ = F₁₆.", "101 110₂ = 56₈."],
            definitions: ["Radix: the number of distinct digits used by a positional number system."],
            revision: "Group bits at the correct width and pad only the leftmost group with leading zeroes if needed.",
            questionTopic: "Binary Arithmetic"
        },
        {
            subject: "DBMS", topic: "Introduction", title: "Database Introduction",
            explanation: "A database organizes related data so it can be stored, queried, and updated. The relational model represents data as tables of rows and columns.",
            keyPoints: ["A relation is represented as a table.", "A tuple is a row; an attribute is a named column.", "Keys help identify records and connect tables."],
            examples: ["A Student table might have StudentID, Name, and Program attributes."],
            definitions: ["Schema: the structure and constraints that describe a database.", "Tuple: a single row in a relation."],
            revision: "Know the difference between relation, tuple, attribute, and schema. Identify keys before designing relationships.",
            questionTopic: "Relational Model"
        },
        {
            subject: "DBMS", topic: "Data Models", title: "Database Data Models",
            explanation: "A data model describes how information, relationships, and constraints are represented. Relational, document, graph, and key-value models suit different workloads.",
            keyPoints: ["Relational models organize records into related tables.", "Document models store nested documents.", "Choose models based on relationships, query patterns, and consistency needs."],
            examples: ["A graph model can represent people and their many mutual connections directly."],
            definitions: ["Data model: concepts and rules used to describe how data is structured."],
            revision: "Compare models by data shape and query needs rather than assuming one model is best for every system.",
            questionTopic: "Relational Model"
        },
        {
            subject: "DBMS", topic: "SQL Queries", title: "SQL Basics",
            explanation: "SQL is a language for defining and querying relational data. A SELECT statement chooses columns from one or more tables.",
            keyPoints: ["WHERE filters input rows.", "GROUP BY forms groups for aggregates.", "HAVING filters groups; DISTINCT removes duplicate result rows."],
            examples: ["SELECT DISTINCT city FROM Student;", "SELECT dept, COUNT(*) FROM Staff GROUP BY dept;"],
            definitions: ["Aggregate: a function such as COUNT or AVG that summarizes values.", "Join: a query operation that combines related rows from tables."],
            revision: "Remember the usual order: SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY.",
            questionTopic: "SQL Queries"
        },
        {
            subject: "DBMS", topic: "Normalization", title: "Normalization",
            explanation: "Normalization restructures relational tables to reduce avoidable duplication and data anomalies while preserving meaningful relationships.",
            keyPoints: ["1NF requires atomic values in each cell.", "2NF removes partial dependencies on part of a composite key.", "Normalization choices balance consistency and query needs."],
            examples: ["Move repeating course records into a Course table and reference them by a key."],
            definitions: ["Functional dependency: X → Y means a value of X determines a value of Y.", "Anomaly: an unwanted inconsistency caused by redundant data."],
            revision: "Identify keys and dependencies first. Check atomic values, then partial and transitive dependencies.",
            questionTopic: "Normalization"
        },
        {
            subject: "DBMS", topic: "Integrity", title: "Integrity & Keys",
            explanation: "Integrity constraints keep database values valid and relationships consistent. Primary and foreign keys are common relational constraints.",
            keyPoints: ["A primary key uniquely identifies a row.", "A foreign key refers to a candidate or primary key in another table.", "Domain constraints restrict values to an acceptable set or range."],
            examples: ["An Order.CustomerID foreign key can reference Customer.CustomerID."],
            definitions: ["Referential integrity: a reference points to an existing related row, or is null when permitted."],
            revision: "Choose a stable, minimal primary key and define foreign keys for relationships between tables.",
            questionTopic: "Relational Model"
        },
        {
            subject: "DBMS", topic: "Security", title: "Database Security",
            explanation: "Database systems separate user applications from data management. Access controls and a layered architecture help protect and organize data.",
            keyPoints: ["Grant only the permissions a role needs.", "Views can limit which rows or columns a user sees.", "Backups and recovery plans help restore data after failure."],
            examples: ["A reporting role may read a view without being able to change the underlying records."],
            definitions: ["Least privilege: granting only the permissions needed for a task.", "View: a named query presented as a virtual table."],
            revision: "Think about identity, least privilege, auditing, backups, and recovery as complementary controls.",
            questionTopic: "Relational Model"
        },
        {
            subject: "DBMS", topic: "Architecture", title: "Database Architecture",
            explanation: "A database system can separate presentation, application logic, and data storage into layers. This separation supports maintainability, access control, and scaling.",
            keyPoints: ["A client requests work from an application or database service.", "The DBMS manages queries, transactions, storage, and recovery.", "Logical independence helps change storage without changing every client."],
            examples: ["A web application validates a request before asking the database to execute a parameterized query."],
            definitions: ["Data independence: the ability to change a schema layer with limited impact on the next layer."],
            revision: "Draw the client, application, DBMS, and storage layers, then identify each layer's responsibilities.",
            questionTopic: "Relational Model"
        },
        {
            subject: "Programming", topic: "C++", title: "C++ Fundamentals",
            explanation: "A C++ program defines types, values, and operations. Functions group reusable instructions behind a name and optional parameters.",
            keyPoints: ["Variables have types that determine their valid values and operations.", "A function can accept parameters and return a value.", "Initialize variables before using them."],
            examples: ["int add(int a, int b) { return a + b; }"],
            definitions: ["Parameter: a named input in a function definition.", "Return value: the result a function sends back to its caller."],
            revision: "Trace a small function by substituting argument values and following each statement in order.",
            questionTopic: "Core Concepts"
        },
        {
            subject: "Programming", topic: "OOP", title: "Object-Oriented Programming",
            explanation: "Object-oriented programming models a program using objects that combine state with operations. Classes describe the data and behavior of their instances.",
            keyPoints: ["Encapsulation groups state and operations behind an interface.", "Inheritance can specialize a related class.", "Polymorphism lets code use a shared interface with different implementations."],
            examples: ["A Shape interface can be implemented by Circle and Rectangle."],
            definitions: ["Class: a definition for a kind of object.", "Instance: a particular object created from a class."],
            revision: "Explain encapsulation, inheritance, and polymorphism with a small example, and avoid inheritance when composition is clearer.",
            questionTopic: "Core Concepts"
        },
        {
            subject: "Programming", topic: "Pointers", title: "Pointers",
            explanation: "Arrays store elements in indexed order. A pointer represents an address; correct use requires respecting object lifetime and array bounds.",
            keyPoints: ["Array indices commonly start at zero.", "Index access is constant-time for a standard array.", "Never dereference a null, dangling, or out-of-bounds pointer."],
            examples: ["If an array has 5 elements, its valid indices are 0 through 4."],
            definitions: ["Pointer: a value that refers to an object's memory address.", "Bounds: the valid index range for a collection."],
            revision: "Check index ranges, pointer validity, and object lifetime whenever using low-level memory operations.",
            questionTopic: "Data Structures"
        },
        {
            subject: "Programming", topic: "Arrays", title: "Arrays",
            explanation: "An array stores a fixed sequence of elements of the same type. Its index identifies an element's position and begins at zero in C++.",
            keyPoints: ["An array of length n has indices 0 through n − 1.", "Reading array[index] takes constant time.", "Accessing outside the valid range is an error."],
            examples: ["For int values[3], the valid elements are values[0], values[1], and values[2]."],
            definitions: ["Array: a contiguous sequence of same-type elements addressed by index."],
            revision: "For every array access, verify the index is non-negative and smaller than the array length.",
            questionTopic: "Data Structures"
        },
        {
            subject: "Programming", topic: "Functions", title: "Functions",
            explanation: "Functions package a named operation with parameters and an optional return value. Small functions make programs easier to test and reuse.",
            keyPoints: ["A function declaration introduces its name and signature.", "Arguments supply the parameter values.", "A return statement provides a result to the caller."],
            examples: ["bool isEven(int n) { return n % 2 == 0; }"],
            definitions: ["Signature: the function name and parameter types that identify a callable form."],
            revision: "Trace parameters through the function body and check that every required return path returns the correct type.",
            questionTopic: "Core Concepts"
        },
        {
            subject: "Programming", topic: "Algorithms", title: "Algorithms & Complexity",
            explanation: "An algorithm is a finite sequence of steps to solve a problem. Complexity describes how its resource use grows with input size.",
            keyPoints: ["Linear search has O(n) worst-case time.", "Binary search requires ordered data and uses O(log n) comparisons.", "Big-O focuses on growth, not exact runtime."],
            examples: ["Doubling input roughly doubles work for a linear-time algorithm."],
            definitions: ["Time complexity: how an algorithm's operation count scales with input size."],
            revision: "State the input-size assumptions first, then count dominant operations and express their growth.",
            questionTopic: "Algorithms"
        },
        {
            subject: "Mathematics", topic: "Algebra", title: "Linear & Quadratic Equations",
            explanation: "An equation states that two expressions are equal. Solve it by applying equivalent operations to both sides and checking candidate solutions.",
            keyPoints: ["Perform the same operation on both sides.", "A product is zero when at least one factor is zero.", "Substitute a solution back into the original equation to verify it."],
            examples: ["x + 7 = 12 gives x = 5.", "x² − 5x + 6 = (x − 2)(x − 3)."],
            definitions: ["Root: a value that makes an equation or polynomial equal zero."],
            revision: "Isolate the variable or factor the expression, solve each factor, and verify the answers.",
            questionTopic: "Algebra"
        },
        {
            subject: "Mathematics", topic: "Statistics", title: "Statistics & Probability",
            explanation: "Statistics summarizes and interprets data. Probability quantifies the chance of an event under a defined model.",
            keyPoints: ["Mean is the sum divided by the number of values.", "For an even number of ordered values, the median is the mean of the two middle values.", "Probability of equally likely outcomes is favorable outcomes divided by total outcomes."],
            examples: ["For a fair die, the chance of an even result is 3/6 = 1/2."],
            definitions: ["Median: the middle value in ordered data, or the midpoint of the two middle values.", "Probability: a number from 0 to 1 expressing event likelihood."],
            revision: "Order the data before finding a median. State the sample space before calculating a probability.",
            questionTopic: "Statistics"
        },
        {
            subject: "Mathematics", topic: "Arithmetic", title: "Arithmetic & Percentages",
            explanation: "Arithmetic combines numbers using operations. A percentage is a ratio expressed per hundred.",
            keyPoints: ["Convert a percentage to a decimal by dividing by 100.", "Use common denominators to add fractions.", "Check units and estimate whether the result is reasonable."],
            examples: ["15% of 200 = 0.15 × 200 = 30.", "3/4 = 0.75."],
            definitions: ["Percentage: a proportion expressed with denominator 100."],
            revision: "Convert percentages before multiplying and simplify fractions by dividing numerator and denominator by common factors.",
            questionTopic: "Arithmetic"
        },
        {
            subject: "Data Structures", topic: "Arrays", title: "Array Basics",
            explanation: "An array stores a sequence of elements that can be accessed by an index. In a zero-based array of length n, valid indices are 0 through n - 1.",
            keyPoints: ["Indexed access is normally O(1).", "Inserting into the middle may require shifting later elements.", "Always check an index against the array bounds."],
            examples: ["For [8, 3, 5], index 1 contains 3."],
            definitions: ["Array: an indexed collection of elements stored in a defined order."],
            revision: "For length n, the last valid zero-based index is n - 1. Distinguish direct access from operations that shift elements.",
            commonMistake: "Using n as the last valid index in a zero-based array.",
            questionTopic: "Arrays"
        },
        {
            subject: "Data Structures", topic: "Time complexity", title: "Algorithm Complexity",
            explanation: "Time complexity describes how an algorithm's operation count grows with input size. Asymptotic notation focuses on growth as input becomes large, not a particular machine's seconds.",
            keyPoints: ["O(1) is constant growth.", "O(n) grows linearly with input size.", "O(n²) often appears with two nested loops over the same input."],
            examples: ["Scanning each of n elements once takes O(n) time."],
            definitions: ["Big O: an asymptotic upper-bound notation commonly used to express worst-case growth."],
            revision: "Identify the input size, count the dominant operations, and simplify by keeping the fastest-growing term.",
            commonMistake: "Treating Big O as an exact runtime in seconds.",
            questionTopic: "Time complexity"
        },
        {
            subject: "Data Structures", topic: "Linked Lists", title: "Linked List Basics",
            explanation: "A linked list connects nodes through references. A singly linked node holds a value and a link to the next node; unlike an array, nodes need not be adjacent in memory.",
            keyPoints: ["Traversal follows links from a starting node.", "Finding an arbitrary position takes O(n) time.", "Insertion can be O(1) when the insertion node is already known."],
            examples: ["head → 4 → 9 → 12 → null"],
            definitions: ["Node: a record containing an element and one or more links to other nodes."],
            revision: "Linked lists support link changes without shifting a suffix, but do not provide direct indexed access.",
            commonMistake: "Assuming linked-list indexing is constant time like array indexing.",
            questionTopic: "Singly Linked Lists"
        },
        {
            subject: "Data Structures", topic: "Stacks", title: "Stacks",
            explanation: "A stack is a linear abstract data type that inserts and removes items at one end called the top. It follows Last In, First Out (LIFO).",
            keyPoints: ["push adds an item to the top.", "pop removes the top item.", "A stack can help manage function calls and expression evaluation."],
            examples: ["Push 4, then 7; the next pop returns 7."],
            definitions: ["LIFO: the most recently added item is the first one removed."],
            revision: "Trace stack operations from the top; the last pushed value is removed first.",
            commonMistake: "Confusing stack order with a queue's FIFO order.",
            questionTopic: "Stacks"
        },
        {
            subject: "Data Structures", topic: "Queues", title: "Queues",
            explanation: "A queue is a linear abstract data type that adds items at the rear and removes them from the front. It follows First In, First Out (FIFO).",
            keyPoints: ["enqueue adds an item.", "dequeue removes the oldest item.", "A circular queue can reuse freed array positions."],
            examples: ["Enqueue A, then B; the next dequeue returns A."],
            definitions: ["FIFO: the earliest added item is the first one removed."],
            revision: "Track front and rear separately and preserve arrival order.",
            commonMistake: "Removing the newest item instead of the oldest one.",
            questionTopic: "Queues"
        },
        {
            subject: "Data Structures", topic: "Trees", title: "Trees and Traversal",
            explanation: "A tree represents hierarchical relationships using nodes and edges. In a binary tree, each node has at most two children. Traversals specify the order in which nodes are visited.",
            keyPoints: ["Preorder visits root, left, right.", "Inorder visits left, root, right.", "Postorder visits left, right, root."],
            examples: ["Inorder traversal of a binary search tree with distinct keys visits keys in sorted order."],
            definitions: ["Leaf: a node with no children.", "Height: the number of edges on a longest downward path, under the common edge-count convention."],
            revision: "Write the traversal order beside each node before listing the result.",
            questionTopic: "Tree traversals"
        },
        {
            subject: "Data Structures", topic: "Heaps", title: "Heap Basics",
            explanation: "A binary heap is a complete binary tree that follows an ordering rule. In a max-heap, each parent is at least as large as its children, so a maximum element is at the root.",
            keyPoints: ["A heap is not necessarily a fully sorted collection.", "The root gives access to the highest-priority item.", "Heaps commonly support priority queues."],
            examples: ["In a max-heap, the root contains a maximum, but sibling subtrees need not be sorted relative to one another."],
            definitions: ["Complete binary tree: every level is full except possibly the last, which is filled from left to right."],
            revision: "Check both the complete-tree shape and the parent-child heap-order property.",
            questionTopic: "Heaps"
        },
        {
            subject: "Data Structures", topic: "Graphs", title: "Graph Search Basics",
            explanation: "A graph consists of vertices and edges. Breadth-first search explores by distance layers using a queue; depth-first search explores a path deeply before backtracking, typically using recursion or a stack.",
            keyPoints: ["An adjacency list stores each vertex's neighbors.", "BFS finds shortest paths by edge count in an unweighted graph.", "DFS is useful for reachability and structural exploration."],
            examples: ["Starting at A, BFS visits all of A's immediate neighbors before moving to the next layer."],
            definitions: ["Vertex: a graph node.", "Edge: a connection between vertices."],
            revision: "Mark visited vertices when enqueuing in BFS to avoid adding the same vertex repeatedly.",
            questionTopic: "Breadth-First Search"
        }
    ];
})();
