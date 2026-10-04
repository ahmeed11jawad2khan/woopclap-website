(() => {
    "use strict";

    const topicGroups = {
        "Data Structures": {
            Basic: [
                "Data and information", "Data structures", "Abstract Data Types", "Algorithm basics",
                "Time complexity", "Space complexity", "Big O, Omega, and Theta", "Arrays",
                "One-dimensional arrays", "Multidimensional arrays", "Array operations", "Linear search",
                "Searching basics", "Basic sorting concepts"
            ],
            Intermediate: [
                "Linked Lists", "Singly Linked Lists", "Doubly Linked Lists", "Circular Linked Lists",
                "Linked List operations", "Stacks", "Stack applications", "Queues", "Circular Queues",
                "Priority Queues", "Recursion", "Trees", "Binary Trees", "Tree traversals",
                "Binary Search Trees"
            ],
            Advanced: [
                "Heaps", "Heap operations", "Heap Sort", "AVL Trees", "Balanced Trees", "Hashing",
                "Hash Tables", "Collision handling", "Graphs", "Graph representations", "Breadth-First Search",
                "Depth-First Search", "Minimum spanning trees", "Shortest paths", "Merge Sort",
                "Quick Sort", "Counting Sort", "Complexity comparison", "Data structure selection",
                "Algorithm analysis", "Problem solving"
            ],
            Hard: []
        },
        "Digital Logic Design": {
            Basic: [
                "Number systems", "Binary numbers", "Decimal numbers", "Octal numbers", "Hexadecimal numbers",
                "Number-system conversions", "Binary arithmetic", "Binary addition", "Binary subtraction",
                "Complements", "1's complement", "2's complement", "Signed numbers", "BCD",
                "Boolean algebra", "Boolean expressions", "Logic gates", "AND, OR, and NOT gates",
                "NAND and NOR gates", "XOR and XNOR gates"
            ],
            Intermediate: [
                "Boolean laws", "Boolean simplification", "De Morgan's laws", "Truth tables", "SOP and POS",
                "Minterms and maxterms", "Karnaugh Maps", "2-variable K-maps", "3-variable K-maps",
                "4-variable K-maps", "Don't-care conditions", "Combinational circuits", "Half Adders",
                "Full Adders", "Half and Full Subtractors", "Multiplexers", "Demultiplexers",
                "Encoders and Decoders", "Comparators"
            ],
            Advanced: [
                "Sequential circuits", "Latches", "Flip-Flops", "SR Flip-Flops", "JK Flip-Flops",
                "D Flip-Flops", "T Flip-Flops", "Registers", "Shift Registers", "Counters",
                "Synchronous counters", "Asynchronous counters", "State diagrams", "State tables",
                "Sequential circuit design", "Timing concepts", "Propagation delay", "Circuit analysis"
            ],
            Hard: []
        },
        "Introduction to Database Systems": {
            Basic: [
                "Databases and DBMS", "Database advantages", "Database users and administrators",
                "Database system components", "Data models", "Database applications", "Database security",
                "Database integrity", "Data abstraction", "Three-level database architecture",
                "External, conceptual, and internal levels", "Data independence",
                "Logical and physical data independence"
            ],
            Intermediate: [
                "Relational model", "Tables, rows, and columns", "Attributes, tuples, and domains", "Keys",
                "Primary keys", "Candidate and super keys", "Foreign keys", "Relationships",
                "Integrity constraints", "Entity and referential integrity", "SQL basics", "DDL, DML, and DCL",
                "SELECT queries", "INSERT, UPDATE, and DELETE", "CREATE, ALTER, and DROP"
            ],
            Advanced: [
                "Entity-Relationship model", "Entities and attributes", "Relationships and cardinality",
                "ER diagrams", "Weak entities", "Normalization", "Functional dependencies",
                "First Normal Form", "Second Normal Form", "Third Normal Form", "Boyce-Codd Normal Form",
                "Relational algebra", "Transactions and ACID", "Concurrency basics", "Database recovery",
                "Database security", "Indexing basics", "Query processing"
            ],
            Hard: []
        }
    };

    window.WOOPCLAP_ACADEMIC_CURRICULUM = Object.entries(topicGroups).map(([subject, levels]) => ({
        subject,
        topics: Object.entries(levels).flatMap(([level, names]) =>
            names.map(name => ({ name, level, scope: "Suggested roadmap; not verified against an uploaded course syllabus." }))
        )
    }));
})();
