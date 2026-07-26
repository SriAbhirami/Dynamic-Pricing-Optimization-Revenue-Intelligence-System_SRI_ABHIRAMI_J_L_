from pydantic import BaseModel


class ProductCreate(BaseModel):
    name: str
    category: str
    current_price: float
    stock: int


class ProductResponse(ProductCreate):
    id: int

    class Config:
        from_attributes = True