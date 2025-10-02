import os
from openai import AzureOpenAI
from dotenv import load_dotenv
import numpy as np
from typing import List

load_dotenv()

class EmbeddingService:
    def __init__(self):
        self.client = AzureOpenAI(
            api_version=os.getenv('AZURE_OPENAI_API_VERSION'),
            azure_endpoint=os.getenv('AZURE_OPENAI_ENDPOINT'),
            api_key=os.getenv('AZURE_OPENAI_API_KEY')
        )
        self.deployment = os.getenv('AZURE_OPENAI_DEPLOYMENT')

    def get_embedding(self, text: str) -> List[float]:
        """Generate embedding for a single text."""
        response = self.client.embeddings.create(
            model=self.deployment,
            input=text
        )
        return response.data[0].embedding

    def cosine_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Calculate cosine similarity between two embeddings."""
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)

        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return float(dot_product / (norm1 * norm2))

    def find_similar_thoughts(self, target_embedding: List[float], all_thoughts: List[dict], threshold: float = 0.7) -> List[dict]:
        """Find thoughts similar to the target embedding."""
        similar_thoughts = []

        for thought in all_thoughts:
            similarity = self.cosine_similarity(target_embedding, thought['embedding'])
            if similarity >= threshold:
                thought_copy = thought.copy()
                thought_copy['similarity_score'] = similarity
                similar_thoughts.append(thought_copy)

        # Sort by similarity score
        similar_thoughts.sort(key=lambda x: x['similarity_score'], reverse=True)
        return similar_thoughts

    def calculate_user_similarity(self, user1_thoughts: List[dict], user2_thoughts: List[dict], top_k: int = 5) -> float:
        """
        Calculate overall similarity between two users based on their thoughts.
        Uses top-K average: takes the K highest similarity scores and averages them.
        This rewards strong connections rather than diluting with many weak matches.
        """
        if not user1_thoughts or not user2_thoughts:
            return 0.0

        similarities = []

        # Compare each thought from user1 with each thought from user2
        for t1 in user1_thoughts:
            for t2 in user2_thoughts:
                similarity = self.cosine_similarity(t1['embedding'], t2['embedding'])
                similarities.append(similarity)

        if not similarities:
            return 0.0

        # Sort similarities in descending order and take top K
        similarities.sort(reverse=True)
        top_similarities = similarities[:min(top_k, len(similarities))]

        # Return average of top K similarities
        return sum(top_similarities) / len(top_similarities)
