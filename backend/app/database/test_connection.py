from sqlalchemy import text
from database import engine

with engine.connect() as connection:
    result = connection.execute(text("SELECT version();"))

    for row in result:
        print(row)