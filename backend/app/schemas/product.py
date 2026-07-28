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
        
class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int
    page: int
    limit: int

    class Config:
        from_attributes = True