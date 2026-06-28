"""
Seed the database with initial questions and a default guest user.
Run: python -m app.db.seed
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select
from app.core.config import settings
from app.core.security import get_password_hash
from app.db.database import Base
from app.models import User, UserRole, Question, Category, Difficulty

engine = create_async_engine(settings.DATABASE_URL, echo=False)
Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

QUESTIONS = [
    # DSA - Easy
    {"title": "What is a linked list?", "content": "Explain what a linked list is, its types, and compare it with an array.", "category": Category.DSA, "difficulty": Difficulty.EASY},
    {"title": "Stack vs Queue", "content": "What is the difference between a Stack and a Queue? Give real-world examples.", "category": Category.DSA, "difficulty": Difficulty.EASY},
    {"title": "Binary Search", "content": "Explain binary search. What is its time complexity and when can you use it?", "category": Category.DSA, "difficulty": Difficulty.EASY},
    # DSA - Medium
    {"title": "Tree Traversals", "content": "Explain in-order, pre-order, and post-order traversal of a binary tree with examples.", "category": Category.DSA, "difficulty": Difficulty.MEDIUM},
    {"title": "Dynamic Programming", "content": "What is dynamic programming? Explain memoization vs tabulation with an example like Fibonacci.", "category": Category.DSA, "difficulty": Difficulty.MEDIUM},
    {"title": "Hash Tables", "content": "How does a hash table work? What are collisions and how are they resolved?", "category": Category.DSA, "difficulty": Difficulty.MEDIUM},
    # DSA - Hard
    {"title": "Graph Algorithms", "content": "Compare Dijkstra's and Bellman-Ford algorithms. When would you choose one over the other?", "category": Category.DSA, "difficulty": Difficulty.HARD},
    {"title": "Red-Black Trees", "content": "Explain Red-Black trees. What properties must they satisfy and why are they preferred over AVL trees?", "category": Category.DSA, "difficulty": Difficulty.HARD},
    # OOP - Easy
    {"title": "Four Pillars of OOP", "content": "What are the four pillars of object-oriented programming? Explain each with a simple example.", "category": Category.OOP, "difficulty": Difficulty.EASY},
    {"title": "Class vs Object", "content": "What is the difference between a class and an object? Provide examples.", "category": Category.OOP, "difficulty": Difficulty.EASY},
    # OOP - Medium
    {"title": "Inheritance vs Composition", "content": "Compare inheritance and composition. When would you favor composition over inheritance?", "category": Category.OOP, "difficulty": Difficulty.MEDIUM},
    {"title": "Abstract Classes vs Interfaces", "content": "What is the difference between abstract classes and interfaces? When should you use each?", "category": Category.OOP, "difficulty": Difficulty.MEDIUM},
    # OOP - Hard
    {"title": "SOLID Principles", "content": "Explain each of the SOLID principles with code examples. How do they improve software design?", "category": Category.OOP, "difficulty": Difficulty.HARD},
    # DBMS - Easy
    {"title": "ACID Properties", "content": "What are ACID properties in a database? Explain each property with an example.", "category": Category.DBMS, "difficulty": Difficulty.EASY},
    {"title": "SQL Joins", "content": "Explain INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL OUTER JOIN with examples.", "category": Category.DBMS, "difficulty": Difficulty.EASY},
    # DBMS - Medium
    {"title": "Normalization", "content": "What is database normalization? Explain 1NF, 2NF, and 3NF with examples.", "category": Category.DBMS, "difficulty": Difficulty.MEDIUM},
    {"title": "Indexes", "content": "What are database indexes? How do B-tree and hash indexes work? What are the trade-offs?", "category": Category.DBMS, "difficulty": Difficulty.MEDIUM},
    # DBMS - Hard
    {"title": "CAP Theorem", "content": "Explain the CAP theorem. How does it apply to distributed databases like Cassandra and MongoDB?", "category": Category.DBMS, "difficulty": Difficulty.HARD},
    # OS - Easy
    {"title": "Process vs Thread", "content": "What is the difference between a process and a thread? How do they share resources?", "category": Category.OS, "difficulty": Difficulty.EASY},
    {"title": "Paging", "content": "What is paging in operating systems? How does it help in memory management?", "category": Category.OS, "difficulty": Difficulty.EASY},
    # OS - Medium
    {"title": "Deadlock", "content": "What is a deadlock? Explain the four necessary conditions and methods to prevent or avoid deadlocks.", "category": Category.OS, "difficulty": Difficulty.MEDIUM},
    {"title": "CPU Scheduling", "content": "Compare FCFS, SJF, Round Robin, and Priority scheduling algorithms.", "category": Category.OS, "difficulty": Difficulty.MEDIUM},
    # OS - Hard
    {"title": "Virtual Memory", "content": "Explain virtual memory, page tables, and the page replacement algorithms (LRU, FIFO, Optimal).", "category": Category.OS, "difficulty": Difficulty.HARD},
    # CN - Easy
    {"title": "OSI Model", "content": "Explain the 7 layers of the OSI model and the function of each layer.", "category": Category.CN, "difficulty": Difficulty.EASY},
    {"title": "TCP vs UDP", "content": "Compare TCP and UDP. When would you choose UDP over TCP?", "category": Category.CN, "difficulty": Difficulty.EASY},
    # CN - Medium
    {"title": "HTTP vs HTTPS", "content": "How does HTTPS work? Explain TLS handshake, certificates, and symmetric/asymmetric encryption.", "category": Category.CN, "difficulty": Difficulty.MEDIUM},
    {"title": "DNS Resolution", "content": "Walk through the complete DNS resolution process when a browser requests 'www.google.com'.", "category": Category.CN, "difficulty": Difficulty.MEDIUM},
    # Python - Easy
    {"title": "Python Data Types", "content": "What are Python's mutable and immutable data types? Give examples and explain why this distinction matters.", "category": Category.PYTHON, "difficulty": Difficulty.EASY},
    {"title": "List vs Tuple", "content": "What is the difference between a list and a tuple in Python? When would you use each?", "category": Category.PYTHON, "difficulty": Difficulty.EASY},
    # Python - Medium
    {"title": "Decorators", "content": "What are Python decorators? How do they work internally? Write a custom decorator example.", "category": Category.PYTHON, "difficulty": Difficulty.MEDIUM},
    {"title": "Generators", "content": "What are Python generators? How are they different from regular functions? When should you use them?", "category": Category.PYTHON, "difficulty": Difficulty.MEDIUM},
    # Python - Hard
    {"title": "GIL", "content": "What is the Global Interpreter Lock (GIL) in Python? How does it affect multithreading? How can you work around it?", "category": Category.PYTHON, "difficulty": Difficulty.HARD},
    # Java - Easy
    {"title": "JVM Architecture", "content": "Explain the architecture of the JVM. What are the ClassLoader, JIT Compiler, and Garbage Collector?", "category": Category.JAVA, "difficulty": Difficulty.EASY},
    # Java - Medium
    {"title": "Java Collections", "content": "Explain HashMap, LinkedHashMap, and TreeMap. What are their internal implementations and time complexities?", "category": Category.JAVA, "difficulty": Difficulty.MEDIUM},
    # C++ - Easy
    {"title": "Pointers vs References", "content": "What is the difference between pointers and references in C++? When would you use each?", "category": Category.CPP, "difficulty": Difficulty.EASY},
    # C++ - Medium
    {"title": "Memory Management", "content": "Explain memory management in C++. Compare stack vs heap allocation, and explain smart pointers.", "category": Category.CPP, "difficulty": Difficulty.MEDIUM},
    # Behavioral - Easy
    {"title": "Tell Me About Yourself", "content": "Give a 2-minute structured introduction of yourself highlighting your technical skills, projects, and career goals.", "category": Category.BEHAVIORAL, "difficulty": Difficulty.EASY},
    {"title": "Handling a Difficult Team Member", "content": "Describe a situation where you had to work with a difficult team member. How did you handle it?", "category": Category.BEHAVIORAL, "difficulty": Difficulty.EASY},
    # Behavioral - Medium
    {"title": "Greatest Technical Challenge", "content": "Describe the most challenging technical problem you've solved. Walk through your approach and what you learned.", "category": Category.BEHAVIORAL, "difficulty": Difficulty.MEDIUM},
    {"title": "Failure and Learning", "content": "Tell me about a time you failed at something technical. What happened and what did you learn from it?", "category": Category.BEHAVIORAL, "difficulty": Difficulty.MEDIUM},
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with Session() as db:
        # Create admin user
        admin_result = await db.execute(select(User).where(User.email == settings.ADMIN_EMAIL))
        if not admin_result.scalar_one_or_none():
            admin = User(
                full_name="Admin",
                email=settings.ADMIN_EMAIL,
                hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
                role=UserRole.ADMIN,
            )
            db.add(admin)
            print(f"✓ Admin user created: {settings.ADMIN_EMAIL}")
        else:
            print("✓ Admin user already exists")

        # Create guest user (used for no-auth mode)
        guest_result = await db.execute(select(User).where(User.email == "guest@interviewai.com"))
        if not guest_result.scalar_one_or_none():
            guest = User(
                full_name="Guest User",
                email="guest@interviewai.com",
                hashed_password=get_password_hash("Guest@123456"),
                role=UserRole.USER,
            )
            db.add(guest)
            print("✓ Guest user created: guest@interviewai.com")
        else:
            print("✓ Guest user already exists")

        # Seed questions
        added = 0
        for q_data in QUESTIONS:
            existing = await db.execute(
                select(Question).where(Question.title == q_data["title"])
            )
            if not existing.scalar_one_or_none():
                db.add(Question(**q_data))
                added += 1

        await db.commit()
        print(f"✓ {added} questions seeded ({len(QUESTIONS) - added} already existed)")
        print("✓ Database seeding complete!")


if __name__ == "__main__":
    asyncio.run(seed())
