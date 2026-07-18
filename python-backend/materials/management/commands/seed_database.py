"""
Management command to seed MatDiscoverAI database with sample data.

Usage:
    python manage.py seed_database
    python manage.py seed_database --clear  # Clear existing data first
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
import uuid


class Command(BaseCommand):
    help = 'Seed database with sample materials, papers, and knowledge graph data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            from materials.models import Material, Category, MaterialProperty, KnowledgeEdge
            from papers.models import ResearchPaper, ExtractedEntity
            KnowledgeEdge.objects.all().delete()
            ExtractedEntity.objects.all().delete()
            MaterialProperty.objects.all().delete()
            ResearchPaper.objects.all().delete()
            Material.objects.all().delete()
            Category.objects.all().delete()

        self.seed_categories()
        self.seed_materials()
        self.seed_papers()
        self.seed_knowledge_edges()
        
        self.stdout.write(self.style.SUCCESS('✅ Database seeded successfully!'))

    def seed_categories(self):
        """Create material categories."""
        from materials.models import Category
        
        categories_data = [
            {'name': 'battery', 'slug': 'battery', 'color': '#8b5cf6', 'icon': 'zap', 'description': 'Battery and energy storage materials'},
            {'name': 'semiconductor', 'slug': 'semiconductor', 'color': '#06b6d4', 'icon': 'cpu', 'description': 'Semiconductor and electronic materials'},
            {'name': 'alloy', 'slug': 'alloy', 'color': '#f59e0b', 'icon': 'layers', 'description': 'Metallic alloys and composites'},
            {'name': 'polymer', 'slug': 'polymer', 'color': '#10b981', 'icon': 'atom', 'description': 'Polymeric materials'},
            {'name': 'ceramic', 'slug': 'ceramic', 'color': '#ef4444', 'icon': 'flask-conical', 'description': 'Ceramic and oxide materials'},
            {'name': 'catalyst', 'slug': 'catalyst', 'color': '#ec4899', 'icon': 'beaker', 'description': 'Catalytic materials'},
            {'name': 'solar', 'slug': 'solar', 'color': '#f97316', 'icon': 'sun', 'description': 'Solar cell and photovoltaic materials'},
            {'name': 'biomedical', 'slug': 'biomedical', 'color': '#6366f1', 'icon': 'heart', 'description': 'Biomedical and implantable materials'},
        ]
        
        for cat_data in categories_data:
            Category.objects.get_or_create(**cat_data)
        
        self.stdout.write(f'  ✓ Created {len(categories_data)} categories')

    def seed_materials(self):
        """Create sample materials."""
        from materials.models import Material, Category, MaterialProperty
        
        materials_data = [
            {
                'name': 'Lithium Iron Phosphate',
                'formula': 'LiFePO4',
                'category_name': 'battery',
                'description': 'High-performance cathode material for lithium-ion batteries with excellent thermal stability.',
                'source': 'literature',
                'confidence': 0.98,
                'properties': [
                    ('energy_density', 'electrical', 170.0, 'Wh/kg'),
                    ('conductivity', 'electrical', 1e-9, 'S/cm'),
                    ('melting_point', 'thermal', 1080.0, '°C'),
                    ('band_gap', 'optical', 3.8, 'eV'),
                ]
            },
            {
                'name': 'Graphene Oxide',
                'formula': 'C10O(OH)1',
                'category_name': 'semiconductor',
                'description': 'Two-dimensional carbon material with exceptional electronic properties.',
                'source': 'extracted',
                'confidence': 0.94,
                'properties': [
                    ('conductivity', 'electrical', 1000.0, 'S/m'),
                    ('surface_area', 'structural', 2630.0, 'm²/g'),
                    ('band_gap', 'optical', 2.5, 'eV'),
                ]
            },
            {
                'name': 'Perovskite Solar Cell (MAPbI3)',
                'formula': 'CH3NH3PbI3',
                'category_name': 'solar',
                'description': 'Hybrid organic-inorganic perovskite with remarkable photovoltaic efficiency.',
                'source': 'literature',
                'confidence': 0.96,
                'properties': [
                    ('efficiency', 'optical', 25.7, '%'),
                    ('band_gap', 'optical', 1.55, 'eV'),
                    ('stability_t80', 'thermodynamic', 1000.0, 'hours'),
                ]
            },
            {
                'name': 'High-Entropy Alloy (CoCrFeMnNi)',
                'formula': 'Co20Cr20Fe20Mn20Ni20',
                'category_name': 'alloy',
                'description': 'Cantor alloy with exceptional mechanical properties at cryogenic temperatures.',
                'source': 'ml_predicted',
                'confidence': 0.89,
                'properties': [
                    ('yield_strength', 'mechanical', 560.0, 'MPa'),
                    ('tensile_strength', 'mechanical', 750.0, 'MPa'),
                    ('elongation', 'mechanical', 65.0, '%'),
                ]
            },
            {
                'name': 'Metal-Organic Framework (MOF-5)',
                'formula': 'Zn4O(BDC)3',
                'category_name': 'catalyst',
                'description': 'Porous material with extremely high surface area for gas storage.',
                'source': 'literature',
                'confidence': 0.97,
                'properties': [
                    ('surface_area', 'structural', 3800.0, 'm²/g'),
                    ('pore_volume', 'structural', 1.2, 'cm³/g'),
                    ('hydrogen_uptake', 'chemical', 5.1, 'wt%'),
                ]
            },
        ]
        
        for mat_data in materials_data:
            category = Category.objects.get(name=mat_data.pop('category_name'))
            properties_data = mat_data.pop('properties')
            
            material, created = Material.objects.get_or_create(
                formula=mat_data['formula'],
                defaults={**mat_data, 'category': category}
            )
            
            if created:
                for prop_name, prop_type, value, unit in properties_data:
                    MaterialProperty.objects.create(
                        material=material,
                        property_name=prop_name,
                        property_type=prop_type,
                        value=value,
                        unit=unit,
                        confidence=material.confidence
                    )
        
        self.stdout.write(f'  ✓ Created {len(materials_data)} materials with properties')

    def seed_papers(self):
        """Create sample research papers."""
        from papers.models import ResearchPaper, ExtractedEntity
        
        papers_data = [
            {
                'title': 'Machine Learning Accelerated Discovery of High-Entropy Alloys',
                'authors': 'Zhang Y., Wang L., Chen M., Thompson G.B.',
                'abstract': 'We present a machine learning framework combining Gaussian process regression with genetic algorithms.',
                'year': 2024,
                'doi': '10.1038/s41586-024-12345-6',
                'journal': 'Nature',
                'keywords': 'high-entropy alloys, machine learning, mechanical properties',
                'status': 'extracted',
                'entities': [
                    ('material', 'High-Entropy Alloy CoCrFeMnNi', 0.95),
                    ('property', 'yield_strength: 680 MPa', 0.92),
                    ('method', 'Gaussian Process Regression', 0.88),
                ]
            },
            {
                'title': 'Breakthrough Efficiency in Perovskite Solar Cells Through Interface Engineering',
                'authors': 'Kim S.H., Park J., Lee H., Green M.A.',
                'abstract': 'A novel interface passivation strategy achieved certified PCE of 26.1%.',
                'year': 2024,
                'doi': '10.1126/science.abd5678',
                'journal': 'Science',
                'keywords': 'perovskite, solar cell, interface engineering',
                'status': 'extracted',
                'entities': [
                    ('material', 'Perovskite MAPbI3', 0.97),
                    ('property', 'efficiency: 26.1%', 0.96),
                    ('method', 'Interface Passivation', 0.91),
                ]
            },
            {
                'title': 'NLP for Automated Extraction of Materials Properties',
                'authors': 'Tada K., Ishikawa R., Matsumoto S.',
                'abstract': 'We developed an NLP pipeline using transformer-based models for property extraction.',
                'year': 2024,
                'journal': 'Computational Materials Science',
                'keywords': 'NLP, information extraction, transformers',
                'status': 'uploaded',
                'entities': []
            }
        ]
        
        for paper_data in papers_data:
            entities_data = paper_data.pop('entities')
            
            paper = ResearchPaper.objects.create(**paper_data)
            
            for entity_type, text, confidence in entities_data:
                ExtractedEntity.objects.create(
                    paper=paper,
                    entity_type=entity_type,
                    entity_text=text,
                    confidence=confidence
                )
        
        self.stdout.write(f'  ✓ Created {len(papers_data)} research papers with entities')

    def seed_knowledge_edges(self):
        """Create knowledge graph edges."""
        from materials.models import Material, KnowledgeEdge
        
        # Get some materials
        try:
            lfp = Material.objects.get(name__contains='Lithium Iron')
            perovskite = Material.objects.get(name__contains='Perovskite')
            graphene = Material.objects.get(name__contains='Graphene')
            hea = Material.objects.get(name__contains='High-Entropy')
        except Material.DoesNotExist:
            self.stdout.write('  ⚠ Skipping knowledge edges (materials not found)')
            return

        edges_data = [
            (lfp, hea, 'used_in', 0.85),
            (perovskite, graphene, 'alternative_to', 0.78),
        ]

        for source, target, relation_type, confidence in edges_data:
            KnowledgeEdge.objects.get_or_create(
                source_material=source,
                target_material=target,
                relation_type=relation_type,
                defaults={'confidence': confidence}
            )
        
        self.stdout.write(f'  ✓ Created {len(edges_data)} knowledge graph edges')
