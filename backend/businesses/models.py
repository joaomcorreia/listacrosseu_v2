import uuid
from django.db import models
from django.utils import timezone

class BusinessClaim(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('expired', 'Expired'),
    ]
    
    user_name = models.CharField(max_length=255)
    user_email = models.EmailField()
    business = models.ForeignKey('Business', on_delete=models.CASCADE)
    verification_token = models.UUIDField(default=uuid.uuid4, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user_name} - {self.business.name}"