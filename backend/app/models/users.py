from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

from app.database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String, nullable=True)

    email = Column(
        String,
        unique=True,
        nullable=True,
        index=True
    )

    hashed_password = Column(String, nullable=True)

    role = Column(
        String,
        nullable=True,
        default="analyst"
    )

    auth_provider = Column(
        String,
        nullable=False,
        default="local"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )